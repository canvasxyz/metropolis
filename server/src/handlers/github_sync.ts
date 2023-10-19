import fs from 'fs/promises';

import { Octokit } from "@octokit/core";
import { Endpoints } from "@octokit/types";
import { createAppAuth } from "@octokit/auth-app";
import { Request, Response } from "express";

import { generateAndRegisterZinvite } from '../auth/create-user';
import { FipFields, PrFields, getConversationByPrId, getOrCreateUserWithGithubUsername, insertConversationPrAndFip, updateConversationPr, updateConversationPrAndFip } from './queries';

import os from "os";
import path from 'path';
import child_process from "child_process";
import { v4 as uuidv4 } from 'uuid';
import Config from "../config";

const getServerNameWithProtocol = Config.getServerNameWithProtocol;

type FIPFrontmatterData = {
  title?: string,
  author?: string,
  "discussions-to"?: string,
  status?: string,
  type?: string,
  category?: string,
  created?: string,
}

type PullRequest = Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"]["data"][0];

function execAsync(command: string, options: child_process.ExecOptions) {
  return new Promise<{stdout: string; stderr: string}>((resolve, reject) => {
    child_process.exec(command, options, (err, stdout, stderr) => {
      if(err) {
        reject(err);
      } else {
        resolve({stdout, stderr});
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

  const lines = source.split('\n');

  const pairs: {key: string, value: string}[] = []
  for(const line of lines) {
    const parts = line.split(":");

    if(parts.length == 1) {
      // this is probably a continuation of the previous line
      if(pairs.length == 0) {
        continue;
      }
      pairs[pairs.length - 1].value += ("\n" + line);
    } else if (parts.length == 2) {
      // this is a new line
      const [k,v] = parts;
      pairs.push({key: k, value: v});
    } else {
      // the value contains colons, so merge them
      const [k, ...valueParts] = parts;
      const v = valueParts.join(':');
      pairs.push({key: k, value: v});
    }
  }

  // reduce into object
  const frontmatter: FIPFrontmatterData = {
    title: "",
    author: "",
    "discussions-to": "",
    status: "",
    type: "",
    category: "",
    created: "",
  };
  for(const {key,value} of pairs) {
    const cleanedKey = key.trim().toLowerCase();

    for(const expectedKey of Object.keys(frontmatter)) {
      if(cleanedKey.startsWith(expectedKey)) {
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

  for(const dirName of dirsToVisit) {
    let dir;

    try {
      dir = await fs.readdir(path.join(repoDir, dirName))
    } catch (err) {
      return;
    }

    for (const file of dir) {
      fipFilenames.push(`${dirName}/${file.toString()}`);
    }
  }

  return fipFilenames;
}

async function getOctoKitForInstallation() {
    if(!process.env.GH_APP_PRIVATE_KEY_PATH) {
      throw Error("GH_APP_PRIVATE_KEY_PATH not set");
    }

    if(!process.env.GH_APP_ID) {
      throw Error("GH_APP_ID not set");
    }

    if(!process.env.GH_APP_INSTALLATION_ID) {
      throw Error("GH_APP_INSTALLATION_ID not set");
    }

    // open pem file
    const privateKey = await fs.readFile(process.env.GH_APP_PRIVATE_KEY_PATH, "utf8");

    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.GH_APP_ID,
        privateKey,
        installationId: process.env.GH_APP_INSTALLATION_ID,
      },
    });
}

async function getFipFromPR(
  repoDir: string,
  pull: PullRequest,
  existingFipFilenames: Set<string>,
  mainBranchName: string
): Promise<FipFields> {
  const owner = pull.head.user?.login as string;
  const repo = pull.head.repo?.name as string;

  const remote = `pull-${pull.id}`;

  // add remote
  await execAsync(`git remote add ${remote} https://github.com/${owner}/${repo}`, { cwd: repoDir });

  // fetch the branches from the remote
  await execAsync(`git fetch ${remote}`, { cwd: repoDir });

  // check out the branch locally

  await execAsync(
    `git switch -c ${remote}-branch ${remote}/${pull.head.ref}`,
    { cwd: repoDir }
  );

  try {
    await execAsync(`git merge ${mainBranchName} -m "nothing"`, { cwd: repoDir });
  } catch (err) {
    // an error is thrown here if there was a merge conflict that could not be
    // automatically resolved - we should just ignore these PRs
    await execAsync(`git reset --merge`, { cwd: repoDir });
  }

  await execAsync(`git merge --quit`, { cwd: repoDir });

  // get all of the names of the FIPs in this branch
  const fipFilenames = await getFipFilenames(repoDir);
  if(fipFilenames === undefined) {
    throw Error("fipFilenames is undefined");
  }

  // get the names of the FIPs that are new
  const newFipFilenames = fipFilenames.filter((filename) => !existingFipFilenames.has(filename));

  if(newFipFilenames.length == 0) {
    // the pull request is not creating a new FIP, ignore this
    console.error(`no new fips for ${owner}/${repo}#${pull.number}`);
    throw Error("no new fips");
  }

  if(newFipFilenames.length > 1) {
    console.error(`more than one fip for ${owner}/${repo}#${pull.number}, using the first one`);
  }

  const filename = newFipFilenames[0];

  // get the contents of the new FIP
  const content = await fs.readFile(path.join(repoDir,filename), "utf8");

  // try to extract frontmatter

  const frontmatterSource = content.split("---")[1];

  let frontmatterData;
  try {
    frontmatterData = parseFrontmatter(frontmatterSource)
  } catch (err) {
    console.error(err);
    frontmatterData = {};
  }

  return {
    description: content,
    topic: filename.split(".")[0],
    fip_title: frontmatterData.title,
    fip_author: frontmatterData.author,
    fip_discussions_to: frontmatterData["discussions-to"],
    fip_status: frontmatterData.status,
    fip_type: frontmatterData.type,
    fip_category: frontmatterData.category,
    fip_created: frontmatterData.created
  }
}

function getWelcomeMessage(serverNameWithProtocol: string, zinvite: string) {
  const url = `${serverNameWithProtocol}/dashboard/c/${zinvite}`;

  return `Thank you for contributing a proposal! A discussion ` +
    `on Metropolis has been automatically opened [here](${url}) where users can give feedback.`;
}

export async function handle_POST_github_sync(req: Request, res: Response) {
  try {
    const installationOctokit = await getOctoKitForInstallation();

    if(!process.env.FIP_REPO_OWNER) {
      throw Error("FIP_REPO_OWNER not set");
    }

    if(!process.env.FIP_REPO_NAME) {
      throw Error("FIP_REPO_NAME not set");
    }

    // we want the main branch to take precedence over all of the others
    const mainBranchName = "master";

    // get existing fips on master
    const {data: pulls} = await installationOctokit.request("GET /repos/{owner}/{repo}/pulls?state=all", {
      repo: process.env.FIP_REPO_NAME,
      owner: process.env.FIP_REPO_OWNER,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    const workingDir = path.join(os.tmpdir(), uuidv4());
    await fs.mkdir(workingDir);

    // clone the repo
    child_process.execSync(
      `git clone https://github.com/${process.env.FIP_REPO_OWNER}/${process.env.FIP_REPO_NAME}`,
      { cwd: workingDir }
    );

    const repoDir = path.join(workingDir, process.env.FIP_REPO_NAME);

    const existingFipFilenames = new Set(await getFipFilenames(repoDir));

    for(const pull of pulls) {
      const githubUsername = pull.user?.login as string;
      const {uid} = await getOrCreateUserWithGithubUsername(githubUsername);

      const prFields: PrFields = {
        owner: uid,
        is_active: pull.state == "open",
        github_repo_name: pull.head.repo?.name,
        github_repo_owner: pull.head.repo?.owner?.login,
        github_branch_name: pull.head.ref,
        github_pr_id: pull.number,
        github_pr_title: pull.title,
        github_pr_submitter: pull.user?.login
      }

      // check if there is a conversation with this PR id already
      const existingConversation = await getConversationByPrId(pull.number);
      if(existingConversation) {
        console.log(`conversation with PR ${pull.number} already exists, updating`);

        // update
        if(pull.state == "open") {
          console.log(`conversation with PR id ${pull.number} is open, updating`);
          // get fip
          let fipFields;
          try {
            fipFields = await getFipFromPR(repoDir, pull, existingFipFilenames, mainBranchName);
          } catch (err) {
            console.log(`could not get fip for PR ${pull.number}, skipping`);
            console.log(err);
            continue;
          }


          // update conversation
          await updateConversationPrAndFip({...prFields, ...fipFields});
        } else {
          console.log(`conversation with PR id ${pull.number} is closed, updating`);
          // if the PR is closed, don't bother getting the fip
          if(existingConversation.is_active) {
            // the conversation has just been closed, trigger some kind of event
          }

          // we don't care about getting the FIP since it's no longer being discussed
          // but we want to update the PR status to closed
          await updateConversationPr(prFields);
        }
      } else {
        if(pull.state == "open") {
          // we only care about inserting conversations that are open
          console.log(`conversation with new PR id ${pull.number} does not exist, inserting`);
          console.log(`trigger some sort of welcome event here`);
          // this PR has just been opened, we should trigger something here, e.g. post a comment/notification

          let fipFields;
          try {
            fipFields = await getFipFromPR(repoDir, pull, existingFipFilenames, mainBranchName);
          } catch (err) {
            console.log(`could not get fip for PR ${pull.number}, skipping`);
            console.log(err);
            continue;
          }

          const insertedRows = await insertConversationPrAndFip({...prFields, ...fipFields} )
          const zid = insertedRows[0].zid;
          const zinvite = await generateAndRegisterZinvite(zid, false);
          // post comment to PR
          await installationOctokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
            owner: process.env.FIP_REPO_OWNER,
            repo: process.env.FIP_REPO_NAME,
            issue_number: pull.number,
            body: getWelcomeMessage(getServerNameWithProtocol(req), zinvite)
          });
        }
      }
    }

    res.send("ok");
  } catch (err) {
    console.error(err);
    res.status(500).send((err as any).message);
  }
}
