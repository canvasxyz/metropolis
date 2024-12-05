import fsPromises from "fs/promises";
import fs from "fs";
import os from "os";
import path from "path";
import child_process from "child_process";

import { Endpoints } from "@octokit/types";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

import { DEFAULT_REPO_COLLABORATORS } from "./github_auth";
import { generateAndRegisterZinvite } from "../auth/create-user";
import Config from "../config";
import {
  getGraphqlForInstallation,
  getOctoKitForInstallation,
  getRepoCollaborators,
} from "./api_wrappers";
import {
  updateOrCreateGitHubUser,
  insertSyncRecord,
  getLatestSync,
  upsertFipVersion,
  upsertGitHubPr,
  FipVersionFields,
  isGitHubSyncEnabledforPr,
  getGitHubPr,
  GithubPrFields,
  upsertConversation,
  getConversationWithFipVersionId,
} from "./queries";

const getServerNameWithProtocol = Config.getServerNameWithProtocol;

type FIPFrontmatterData = {
  fip?: string;
  title?: string;
  author?: string;
  "discussions-to"?: string;
  status?: string;
  type?: string;
  category?: string;
  created?: string;
};

type PullRequest =
  Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"]["data"][0];

const extra = "GIT_EXEC_PATH=/app/.apt/usr/lib/git-core";

const DISCUSSION_REGEX = new RegExp(
  `https://github.com/${process.env.FIP_REPO_OWNER}/${process.env.FIP_REPO_NAME}/discussions/(\\d+)`,
);

function execAsync(command: string, options: child_process.ExecOptions) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    child_process.exec(command, options, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

function parseFrontmatter(source: string) {
  /**
   * this function takes a roughly-yaml frontmatter string and tries to
   * extract all of the fields
   * it is more permissive than just using a yaml parser because users often
   * give invalid yaml (e.g. missing quotes around strings) for the values
   */

  const lines = source.split("\n");

  const pairs: { key: string; value: string }[] = [];
  for (const line of lines) {
    const parts = line.split(":");

    if (parts.length == 1) {
      // this is probably a continuation of the previous line
      if (pairs.length == 0) {
        continue;
      }
      pairs[pairs.length - 1].value += "\n" + line;
    } else if (parts.length == 2) {
      // this is a new line
      const [k, v] = parts;
      pairs.push({ key: k, value: v });
    } else {
      // the value contains colons, so merge them
      const [k, ...valueParts] = parts;
      const v = valueParts.join(":");
      pairs.push({ key: k, value: v });
    }
  }

  // reduce into object
  const frontmatter: FIPFrontmatterData = {
    fip: "",
    title: "",
    author: "",
    "discussions-to": "",
    status: "",
    type: "",
    category: "",
    created: "",
  };
  for (const { key, value } of pairs) {
    const cleanedKey = key.trim().toLowerCase();

    for (const expectedKey of Object.keys(frontmatter)) {
      if (cleanedKey.startsWith(expectedKey)) {
        // is there a way to tell the type system that `expectedKey` is one of the keys of `frontmatter`
        // we need something like `Object.keys` but for objects with known fields
        // @ts-ignore
        frontmatter[expectedKey] = value.trim();
      }
    }
  }

  return frontmatter;
}

async function getFipFilenames(repoDir: string) {
  const dirsToVisit = ["/FIPS", "/FRCs"];

  const fipFilenames: string[] = [];

  for (const dirName of dirsToVisit) {
    let dir;

    try {
      dir = await fsPromises.readdir(path.join(repoDir, dirName));
    } catch (err) {
      continue;
    }

    for (const file of dir) {
      fipFilenames.push(`${dirName}/${file.toString()}`);
    }
  }

  return fipFilenames;
}

async function getFipFromPR(
  repoDir: string,
  pull: PullRequest,
  existingFipFilenames: Set<string>,
  mainBranchName: string,
): Promise<FipVersionFields> {
  const owner = pull.head.user?.login as string;
  const repo = pull.head.repo?.name as string;

  const remote = `pull-${pull.id}`;

  // add remote
  await execAsync(
    `${extra} git remote add ${remote} https://github.com/${owner}/${repo}`,
    { cwd: repoDir },
  );

  // fetch the branches from the remote
  await execAsync(`${extra} GIT_TERMINAL_PROMPT=0 git fetch ${remote}`, {
    cwd: repoDir,
  });

  // check out the branch locally
  await execAsync(
    `${extra} git switch -c ${remote}-branch ${remote}/${pull.head.ref}`,
    {
      cwd: repoDir,
    },
  );

  // get updated filenames against the mergebase, unless the FIP PR isn't against master
  const { stdout: mergeBase } = await execAsync(
    `${extra} git merge-base ${mainBranchName} ${remote}/${pull.head.ref}`,
    { cwd: repoDir },
  );
  const { stdout: updatedFilenamesText } = await execAsync(
    `${extra} git diff --name-status ${
      pull.base.ref === mainBranchName ? mergeBase : pull.base.ref
    }`,
    { cwd: repoDir },
  );
  const createdFilenames = updatedFilenamesText
    .trim()
    .split("\n")
    .filter((fn) => fn.startsWith("A"))
    .map((fn) => fn.slice(1).trim())
    .filter(
      (filename) =>
        filename.toLowerCase().startsWith("fip0001v2") ||
        filename.toLowerCase().startsWith("fips/") ||
        filename.toLowerCase().startsWith("frcs/"),
    );

  const updatedFilenames = updatedFilenamesText
    .trim()
    .split("\n")
    .filter((fn) => fn.startsWith("M"))
    .map((fn) => fn.slice(1).trim())
    .filter(
      (filename) =>
        filename.toLowerCase().startsWith("fip0001v2") ||
        filename.toLowerCase().startsWith("fips/") ||
        filename.toLowerCase().startsWith("frcs/"),
    );

  if (createdFilenames.length > 1) {
    console.error(
      `[${pull.head?.label}] multiple FIP-XXXX.md files changed in PR #${pull.number}, using the last one`,
    );
  }

  if (createdFilenames.length > 0) {
    const filename = createdFilenames[createdFilenames.length - 1];

    // get the contents of the new FIP
    const content = await fsPromises.readFile(
      path.join(repoDir, filename),
      "utf8",
    );

    // try to extract fip number
    const fipNumberMatch = filename.match(/fip-([0-9]*)/);
    let fipNumber = fipNumberMatch ? parseInt(fipNumberMatch[1], 10) : 0;

    // try to extract frontmatter
    const contentParts = content.split("---");
    const frontmatterSource = contentParts[1];
    const description = contentParts.slice(2).join("---");

    let frontmatterData;
    try {
      frontmatterData = parseFrontmatter(frontmatterSource);
    } catch (err) {
      console.error(err);
      frontmatterData = {};
    }

    // try to extract fip number again
    if (!fipNumber || isNaN(fipNumber)) {
      const frontmatterFipNumberMatch =
        frontmatterData.fip?.match(/(fip-)?([0-9]*)/);
      fipNumber = frontmatterFipNumberMatch
        ? parseInt(frontmatterFipNumberMatch[2], 10)
        : 0;
    }

    let fipTitle;
    try {
      if (
        frontmatterData.title &&
        typeof JSON.parse(frontmatterData.title) === "string"
      ) {
        fipTitle = JSON.parse(frontmatterData.title);
      }
    } catch (err) {
      fipTitle = frontmatterData.title;
    }

    return {
      fip_content: description,
      github_pr_id: pull.number,
      fip_number: isNaN(fipNumber) ? null : fipNumber,
      fip_title: fipTitle,
      fip_author: frontmatterData.author || null,
      fip_discussions_to: frontmatterData["discussions-to"] || null,
      fip_status: frontmatterData.status || null,
      fip_type: frontmatterData.type || null,
      fip_category: frontmatterData.category || null,
      fip_created: pull.created_at,
      fip_files_created: createdFilenames.join("\n"),
      fip_files_updated: updatedFilenames.join("\n"),
    };
  } else {
    // fip that only changed a file
    return {
      github_pr_id: pull.number,
      fip_number: null,
      fip_title: pull.title,
      fip_author: pull.user?.login || null,
      fip_content: null,
      fip_category: null,
      fip_discussions_to: null,
      fip_status: null,
      fip_type: null,
      fip_created: pull.created_at,
      fip_files_created: createdFilenames.join("\n"),
      fip_files_updated: updatedFilenames.join("\n"),
    };
  }
}

function getWelcomeMessage(serverNameWithProtocol: string, zinvite: string) {
  const url = `${serverNameWithProtocol}/dashboard/c/${zinvite}`;

  return (
    `Thank you for contributing a proposal! A discussion ` +
    `on Fil Poll has been automatically opened [here](${url}) where users can give feedback.`
  );
}

async function addDiscussionComment(
  message: string,
  target: { repoOwner: string; repoName: string; discussionNumber: number },
) {
  const graphqlWithAuth = await getGraphqlForInstallation();

  // @ts-ignore
  const {
    repository: {
      discussion: { id: discussionId },
    },
  } = (await graphqlWithAuth(
    `query {
      repository(owner: "${target.repoOwner}", name: "${target.repoName}") {
        discussion(number: ${target.discussionNumber}) {
          id
        }
      }
    }`,
  )) as any;

  await graphqlWithAuth(
    `mutation {
      addDiscussionComment(input: {discussionId: "${discussionId}", body: "${message}"}) {
        clientMutationId
      }
    }`,
  );
}

export async function do_github_sync() {
  const installationOctokit = await getOctoKitForInstallation();

  if (!process.env.FIP_REPO_OWNER) {
    throw Error("FIP_REPO_OWNER not set");
  }

  if (!process.env.FIP_REPO_NAME) {
    throw Error("FIP_REPO_NAME not set");
  }

  // we want the main branch to take precedence over all of the others
  const mainBranchName = "master";

  // get existing fips on master
  const pulls = await installationOctokit.paginate(
    installationOctokit.rest.pulls.list,
    {
      repo: process.env.FIP_REPO_NAME,
      owner: process.env.FIP_REPO_OWNER,
      per_page: 100,
      state: "all",
    },
  );

  const workingDir = path.join(os.tmpdir(), uuidv4());
  await fsPromises.mkdir(workingDir);

  // clone the repo
  child_process.execSync(
    `${extra} git clone https://github.com/${process.env.FIP_REPO_OWNER}/${process.env.FIP_REPO_NAME}`,
    { cwd: workingDir },
  );

  const repoDir = path.join(workingDir, process.env.FIP_REPO_NAME);

  const existingFipFilenames = new Set(await getFipFilenames(repoDir));

  console.log(
    `Found ${existingFipFilenames.size} FIPs in master, ${
      pulls.length
    } open FIPs in PRs: \n${pulls
      .map((pull: any) => "- " + pull.head?.label)
      .join("\n")}`,
  );

  let repoCollaboratorIds;
  try {
    const repoCollaborators = await getRepoCollaborators();
    repoCollaboratorIds = new Set(repoCollaborators.map((c) => c.id));
  } catch (error) {
    const response = await Promise.all(
      DEFAULT_REPO_COLLABORATORS.map((user) =>
        fetch("https://api.github.com/users/${user}")
          .then((response) => response.json())
          .then((json) => json.id),
      ),
    );
    repoCollaboratorIds = new Set(response);
  }

  const userIds: Record<string, number> = {};

  let fipsUpdated = 0;
  let fipsCreated = 0;

  for (const pull of pulls) {
    if (!pull.user) {
      continue;
    }

    // if github sync is disabled for this pr, skip
    if (!(await isGitHubSyncEnabledforPr(pull.number))) {
      console.log(
        `[${pull.head?.label}] github sync is disabled for PR #${pull.number}, skipping`,
      );
      continue;
    }

    // try to get the existing github pr from the database
    // this is used to detect whether github PRs have changed state
    const existingGitHubPr = await getGitHubPr(pull.number);

    if (
      existingGitHubPr &&
      existingGitHubPr.closed_at &&
      pull.state === "closed"
    ) {
      console.log(
        `[${pull.head?.label}] PR #${pull.number} is already closed, skipping`,
      );
      continue;
    }

    await upsertGitHubPr({
      repo_name: pull.head.repo?.name,
      repo_owner: pull.head.repo?.owner?.login,
      branch_name: pull.head.ref,
      id: pull.number,
      title: pull.title,
      submitter: pull.user?.login,
      opened_at: pull.created_at,
      closed_at: pull.closed_at,
      updated_at: pull.updated_at,
      merged_at: pull.merged_at,
      is_draft: pull.draft,
    });

    // extract the fip data from the pr
    let fipFields;
    try {
      fipFields = await getFipFromPR(
        repoDir,
        pull,
        existingFipFilenames,
        mainBranchName,
      );
    } catch (err) {
      console.log(
        `[${pull.head?.label}] could not get fip for PR #${pull.number}`,
      );
      continue;
    }

    const fipVersionId = await upsertFipVersion(fipFields);

    // update or insert conversation
    if (userIds[pull.user.login] === undefined) {
      // We have to do a separate request to get the email address from the user's profile
      // because this information is not returned by the pulls endpoint
      const {
        data: { email },
      } = await installationOctokit.request("GET /users/{username}", {
        username: pull.user.login,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      const { uid } = await updateOrCreateGitHubUser({
        id: pull.user.id,
        email,
        username: pull.user.login,
      });

      userIds[pull.user.login] = uid;
    }

    const { zid, isNew } = await upsertConversation({
      owner: userIds[pull.user.login],
      is_active: pull.state == "open",
      is_archived: pull.state === "closed",
      fip_version_id: fipVersionId,
      github_sync_enabled: true,
    });

    // TODO: we should only do this if it's a new conversation
    if (isNew) {
      await generateAndRegisterZinvite(zid, false);
    }

    // const welcomeMessage = getWelcomeMessage(
    //   getServerNameWithProtocol(req),
    //   zinvite,
    // );
    // post comment to PR
    // await installationOctokit.request(
    //   "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
    //   {
    //     owner: process.env.FIP_REPO_OWNER,
    //     repo: process.env.FIP_REPO_NAME,
    //     issue_number: pull.number,
    //     body: welcomeMessage,
    //   },
    // );

    // // this will only work if the discussions_to field contains a single link to a discussion
    // // so it's kind of brittle
    // if (fipFields.fip_discussions_to) {
    //   try {
    //     // post the welcome message to the discussion as well
    //     const match =
    //       fipFields.fip_discussions_to.match(DISCUSSION_REGEX);
    //     if (match !== null) {
    //       const discussionNumber = match[1];
    //       // post to the discussion
    //       await addDiscussionComment(welcomeMessage, {
    //         repoOwner: process.env.FIP_REPO_OWNER as string,
    //         repoName: process.env.FIP_REPO_NAME as string,
    //         discussionNumber: parseInt(discussionNumber),
    //       });
    //     }
    //   } catch (err) {
    //     console.log(
    //       `could not post welcome message to discussion for PR ${pull.number} ${pull.head?.label}`,
    //     );
    //   }
    // }
  }

  await insertSyncRecord();

  return {
    existingFips: existingFipFilenames.size,
    openPulls: pulls.length,
    fipsUpdated,
    fipsCreated,
  };
}

function parseFipContent(content: string) {
  // try to extract frontmatter
  const contentParts = content.split("---");
  const frontmatterSource = contentParts[1];
  const description = contentParts.slice(2).join("---");

  let frontmatterData;
  try {
    frontmatterData = parseFrontmatter(frontmatterSource);
  } catch (err) {
    console.error(err);
    frontmatterData = {};
  }

  let fipTitle;
  try {
    if (
      frontmatterData.title &&
      typeof JSON.parse(frontmatterData.title) === "string"
    ) {
      fipTitle = JSON.parse(frontmatterData.title);
    }
  } catch (err) {
    fipTitle = frontmatterData.title;
  }

  return {
    description,
    title: fipTitle,
    author: frontmatterData.author,
    created: frontmatterData.created,
    discussions_to: frontmatterData["discussions-to"],
    status: frontmatterData.status,
    type: frontmatterData.type,
    category: frontmatterData.category,
  };
}

async function do_master_sync() {
  if (!process.env.FIP_REPO_OWNER) {
    throw Error("FIP_REPO_OWNER not set");
  }

  if (!process.env.FIP_REPO_NAME) {
    throw Error("FIP_REPO_NAME not set");
  }

  const workingDir = path.join(os.tmpdir(), uuidv4());
  await fsPromises.mkdir(workingDir);

  // clone the repo
  child_process.execSync(
    `${extra} git clone https://github.com/${process.env.FIP_REPO_OWNER}/${process.env.FIP_REPO_NAME}`,
    { cwd: workingDir },
  );

  const repoDir = path.join(workingDir, process.env.FIP_REPO_NAME);

  const fipFilenames = await getFipFilenames(repoDir);

  const result = [];

  // for each fip, extract the metadata and insert it into the database
  for (const fipFileName of fipFilenames) {
    const content = await fsPromises.readFile(
      path.join(repoDir, fipFileName),
      "utf8",
    );

    const fipData = parseFipContent(content);

    const fipFileNameParts = fipFileName.split("/");
    const fipNameParts = fipFileNameParts[fipFileNameParts.length - 1]
      .replace(".md", "")
      .split("-");
    const number = parseInt(fipNameParts[fipNameParts.length - 1], 10);

    await upsertFipVersion({
      fip_number: number,
      github_pr_id: null,
      fip_content: fipData.description,
      fip_author: fipData.author || null,
      fip_category: fipData.category || null,
      fip_created: fipData.created || null,
      fip_discussions_to: fipData.discussions_to || null,
      fip_files_created: fipFileName,
      fip_files_updated: null,
      fip_status: fipData.status || null,
      fip_title: fipData.title || null,
      fip_type: fipData.type || null,
    });

    result.push({ ...fipData, number });
  }

  return result;
}

export async function handle_POST_github_sync(req: Request, res: Response) {
  try {
    await do_master_sync();
    res.json(await do_github_sync());
  } catch (err) {
    console.error(err);
    res.status(500).send((err as any).message);
  }
}

export async function handle_GET_github_syncs(req: Request, res: Response) {
  const latest = await getLatestSync();

  res.json({
    success: true,
    latest,
  });
}

export async function handle_POST_initial_sync(req: Request, res: Response) {
  try {
    res.json(await do_github_sync());
  } catch (err) {
    console.error(err);
    res.status(500).send((err as any).message);
  }
}
