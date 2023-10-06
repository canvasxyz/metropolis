import fs from 'fs';

import { Octokit } from "@octokit/core";
import { Endpoints } from "@octokit/types";
import { createAppAuth } from "@octokit/auth-app";
import { Request, Response } from "express";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import { Volume, createFsFromVolume, IFs } from "memfs";

import { queryP } from '../db/pg-query';
import { generateAndRegisterZinvite } from '../auth/create-user';

type FIPFrontmatterData = {
  title?: string,
  author?: string,
  "discussions-to"?: string,
  status?: string,
  type?: string,
  category?: string,
  created?: string,
}

type FIP = {
  filename: string,
  content: string,
  frontmatterData: FIPFrontmatterData
}

type PullWithFip = {
  pull: PullRequest,
  fip?: FIP
}

type PullRequest = Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"]["data"][0];


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


async function getFipFilenames(currentFs: IFs) {
  const dirsToVisit = ["/FIPS", "/FRCs"];

  const fipFilenames: string[] = [];

  for(const dirName of dirsToVisit) {
    let dir;

    try {
      dir = await currentFs.promises.readdir(dirName);
    } catch (err) {
      return;
    }

    for (const file of dir) {
      fipFilenames.push(`${dirName}/${file.toString()}`);
    }
  }

  return fipFilenames;
}

function getOctoKitForInstallation() {
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
    const privateKey = fs.readFileSync(process.env.GH_APP_PRIVATE_KEY_PATH, "utf8");

    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.GH_APP_ID,
        privateKey,
        installationId: process.env.GH_APP_INSTALLATION_ID,
      },
    });
}

async function getFipFromPR(pull: PullRequest, existingFipFilenames: Set<string>): Promise<FIP | undefined> {
  // create an in-memory filesystem to hold the cloned repo
  const vol = new Volume();
  const memfs = createFsFromVolume(vol);

  const owner = pull.head.user?.login as string;
  const repo = pull.head.repo?.name as string;

  // clone the repo from the pull request
  await git.clone({
    fs: memfs,
    http,
    dir: '/',
    url: `https://github.com/${owner}/${repo}`,
    ref: pull.head.ref,
    singleBranch: true,
    depth: 1,
  });

  // git remote add filecoin-project/FIPs https://github.com/filecoin-project/FIPs.git
  await git.addRemote({
    fs: memfs,
    dir: '/',
    remote: 'filecoin-project/FIPs',
    url: "https://github.com/filecoin-project/FIPs.git"
  });

  // add master as a remote
  // TODO: this fails for a bunch of cases because isomorphic git doesn't support
  // resolving merge conflicts. we should just replace this with actual git (and use
  // temp folders for isolating the repos)
  await git.pull({
    fs: memfs,
    http,
    dir: '/',
    // url: `https://github.com/${process.env.FIP_REPO_OWNER}/${process.env.FIP_REPO_NAME}`,
    remote: 'filecoin-project/FIPs',
    remoteRef: 'master',
    author: {
      name: "arbitrary",
      email: "arbitrary",
    }
  });

  // get all of the names of the FIPs in this branch
  const fipFilenames = await getFipFilenames(memfs);
  if(fipFilenames === undefined) {
    throw Error("fipFilenames is undefined");
  }

  // get the names of the FIPs that are new
  const newFipFilenames = fipFilenames.filter((filename) => !existingFipFilenames.has(filename));

  if(newFipFilenames.length == 0) {
    // the pull request is not creating a new FIP, ignore this
    // throw Error("no new fips");
    console.error(`no new fips for ${owner}/${repo}#${pull.number}`);
    return;
  }

  if(newFipFilenames.length > 1) {
    console.log(`more than one fip for ${owner}/${repo}#${pull.number}, using the first one`);
  }

  const filename = newFipFilenames[0];

  // get the contents of the new FIP
  const content = (await memfs.promises.readFile(filename, "utf8")).toString();

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
    filename,
    content,
    frontmatterData
  };
}


export async function handle_POST_github_sync(req: Request, res: Response) {
  try {
    const installationOctokit = getOctoKitForInstallation();

    if(!process.env.FIP_REPO_OWNER) {
      throw Error("FIP_REPO_OWNER not set");
    }

    if(!process.env.FIP_REPO_NAME) {
      throw Error("FIP_REPO_NAME not set");
    }

    // we want the main branch to take precedence over all of the others
    const mainBranchName = "master";

    // get existing fips on master
    const {data: pulls} = await installationOctokit.request("GET /repos/{owner}/{repo}/pulls", {
      repo: process.env.FIP_REPO_NAME,
      owner: process.env.FIP_REPO_OWNER,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    // check out the main branch
    const vol = new Volume();
    const memfs = createFsFromVolume(vol);
    await git.clone({
      fs: memfs,
      http,
      dir: '/',
      url: `https://github.com/${process.env.FIP_REPO_OWNER}/${process.env.FIP_REPO_NAME}`,
      ref: mainBranchName,
      singleBranch: true,
      depth: 1,
    });

    const existingFipFilenames = new Set(await getFipFilenames(memfs));

    const pullsWithFips: PullWithFip[] = [];

    for(const pull of pulls) {
      try {
        const fip = await getFipFromPR(pull, existingFipFilenames);
        if(fip) pullsWithFips.push({pull, fip});
      } catch (err) {
        console.error(err);
      }
    }

    // clear conversation table
    await queryP("DELETE FROM zinvites CASCADE", []);
    await queryP("DELETE FROM conversations CASCADE", []);

    // write fips to conversation table
    for (const {pull, fip} of pullsWithFips) {
      if(!fip) {
        continue;
      }

      // insert fip
      const query = `
      INSERT INTO conversations (
        description,
        topic,
        owner,
        github_repo_name,
        github_repo_owner,
        github_branch_name,
        github_pr_id,
        github_pr_title,
        fip_title,
        fip_author,
        fip_discussions_to,
        fip_status,
        fip_type,
        fip_category,
        fip_created
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15
      ) RETURNING zid;
      `;
      const description = fip.content;
      const topic = fip.filename.split(".")[0];
      const owner = 33;
      const repo = pull.head.repo?.name;
      const repoOwner = pull.head.repo?.owner?.login;
      const branch = pull.head.ref;
      const prId = pull.number;
      const prTitle = pull.title;

      const rows = await queryP(
        query,
        [
          description,
          topic,
          owner,
          repo,
          repoOwner,
          branch,
          prId,
          prTitle,
          fip.frontmatterData.title || null,
          fip.frontmatterData.author || null,
          fip.frontmatterData["discussions-to"] || null,
          fip.frontmatterData.status || null,
          fip.frontmatterData.type || null,
          fip.frontmatterData.category || null,
          fip.frontmatterData.created || null
        ]
      );
      const zid = rows[0].zid;
      await generateAndRegisterZinvite(zid, false);
    }

    res.send("ok");
  } catch (err) {
    console.error(err);
    res.status(500).send((err as any).message);
  }
}
