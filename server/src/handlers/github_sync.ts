import fs from 'fs';

import { Octokit } from "@octokit/core";
import { createAppAuth } from "@octokit/auth-app";

import { Request, Response } from "express";

export async function handle_POST_github_sync(req: Request, res: Response) {

  if(!process.env.GH_APP_PRIVATE_KEY_PATH) {
    throw Error("GH_APP_PRIVATE_KEY_PATH not set");
  }

  if(!process.env.FIP_REPO_OWNER) {
    throw Error("FIP_REPO_OWNER not set");
  }

  if(!process.env.FIP_REPO_NAME) {
    throw Error("FIP_REPO_NAME not set");
  }

  if(!process.env.GH_APP_ID) {
    throw Error("GH_APP_ID not set");
  }

  if(!process.env.GH_APP_INSTALLATION_ID) {
    throw Error("GH_APP_INSTALLATION_ID not set");
  }


  // open pem file
  const privateKey = fs.readFileSync(process.env.GH_APP_PRIVATE_KEY_PATH, "utf8");

  const installationOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GH_APP_ID,
      privateKey,
      installationId: process.env.GH_APP_INSTALLATION_ID,
    },
  });

  const {data: branchData} = await installationOctokit.request("GET /repos/{owner}/{repo}/branches", {
    owner: process.env.FIP_REPO_OWNER,
    repo: process.env.FIP_REPO_NAME,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  console.log(branchData);

  res.send("ok");
}
