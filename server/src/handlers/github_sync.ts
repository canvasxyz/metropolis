import fs from 'fs';

import { Octokit } from "@octokit/core";
import { createAppAuth } from "@octokit/auth-app";

import { Request, Response } from "express";

import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import { Volume, createFsFromVolume, IFs } from "memfs";

import SQL from "../db/sql";
import { queryP } from '../db/pg-query';

type FIP = {
  filename: string,
  content: string,
  branch: string
}

async function* extractFIPsFromFs(currentFs: IFs, seenFips: Record<string, any>) {
  let dir;

  try {
    dir = await currentFs.promises.readdir("/FIPS");
  } catch (err) {
    return;
  }

  for (const file of dir) {
    const filename = file.toString();

    if (seenFips[filename]) {
      continue;
    }

    const content = (await currentFs.promises.readFile(`/FIPS/${filename}`, "utf8")).toString();
    yield {
      filename,
      content
    };
  }
}

async function extractFIPs(branches: string[]) {
  const vol = new Volume();
  const memfs = createFsFromVolume(vol);

  await git.clone({
    fs: memfs,
    http,
    dir: '/',
    url: `https://github.com/${process.env.FIP_REPO_OWNER}/${process.env.FIP_REPO_NAME}`,
    depth: 1,
  });

  let fips: Record<string, FIP> = {};
  for(const branch of branches) {
    await git.checkout({
      fs: memfs,
      dir: "/",
      ref: branch,
      force: true,
    });

    const newFips: Record<string, FIP> = {};
    for await (const fip of extractFIPsFromFs(memfs, fips)) {
      newFips[fip.filename] = {
        ...fip,
        branch
      };
    }
    fips = {...fips, ...newFips};
  }

  return fips;
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


export async function handle_POST_github_sync(req: Request, res: Response) {
  try {
    const installationOctokit = getOctoKitForInstallation();

    if(!process.env.FIP_REPO_OWNER) {
      throw Error("FIP_REPO_OWNER not set");
    }

    if(!process.env.FIP_REPO_NAME) {
      throw Error("FIP_REPO_NAME not set");
    }

    const {data: branchData} = await installationOctokit.request("GET /repos/{owner}/{repo}/branches", {
      owner: process.env.FIP_REPO_OWNER,
      repo: process.env.FIP_REPO_NAME,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    // we want the main branch to take precedence over all of the others
    const mainBranchName = "master";
    const branches = branchData.map((branch) => branch.name);
    const branchesNoMain = branches.filter((branch) => branch !== mainBranchName);

    console.log("extracting fips...");

    // the main branch should take precedence over everything else
    const fips = await extractFIPs([mainBranchName, ...branchesNoMain]);

    console.log("clearing conversations table");

    // clear conversation table
    await queryP("DELETE FROM conversations CASCADE", []);

    // TODO: figure out what fields actually need to be inserted

    // write fips to conversation table
    for (const fip of Object.values(fips)) {
      // insert fip
      const insertQuery = SQL.sql_conversations.insert({
        description: fip.content.slice(49999),
        topic: fip.filename.split(".")[0],
        owner: 33
      }).toString();
      await queryP(insertQuery, []);
    }

    res.send("ok");
  } catch (err) {
    res.status(500).send((err as any).message);
  }
}
