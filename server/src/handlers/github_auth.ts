import { Response } from "express";
import { Octokit } from "@octokit/core";
import { createOAuthUserAuth } from "@octokit/auth-oauth-user";

import { startSession } from "../session";
import { addCookies } from "../utils/cookies";
import fail from "../utils/fail";
import { updateOrCreateGitHubUser } from "./queries";
import { getRepoCollaborators } from "./api_wrappers";
import Config from "../config";

export const DEFAULT_REPO_COLLABORATORS = [
  "raykyri",
  "kaitlin-beegle",
  "luckyparadise",
];

/** api handlers for performing a github authentication flow */

export function handle_GET_github_init(
  req: { p: { dest: string; owner: string } },
  res: { redirect: (arg0: string) => void }
) {
  let dest = req.p.dest.replace(/\/dashboard\/.*/, "/dashboard");
  const clientId = process.env.GH_APP_CLIENT_ID;
  const redirectUri = `${Config.getServerUrl()}/api/v3/github_oauth_callback?dest=${dest}`;
  const githubAuthorizeUrl = `https://github.com/login/oauth/authorize?scope=user:email&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}`;
  res.redirect(githubAuthorizeUrl);
}

export function handle_GET_github_oauth_callback(
  req: { p: { uid?: any; code: any; dest?: any } },
  res: any // { redirect: (arg0: any) => void }
) {
  handleGithubOauthCallback(req, res).catch((err) => {
    fail(res, 500, err.message);
  });
}

async function handleGithubOauthCallback(
  req: { p: { uid?: any; code: string; dest?: any } },
  res: Response
) {
  const octokit = new Octokit({
    authStrategy: createOAuthUserAuth,
    auth: {
      clientId: process.env.GH_APP_CLIENT_ID,
      clientSecret: process.env.GH_APP_CLIENT_SECRET,
      code: req.p.code,
    },
  });

  // get the github username that is associated with the token
  const {
    data: { login: githubUsername, id: githubUserId, email: githubUserEmail },
  } = await octokit.request("GET /user");

  if (!githubUsername) {
    throw Error("invalid github access token");
  }

  // the user is now authenticated
  // check if the user is a proposals repo collaborator/owner
  let isRepoCollaborator = githubUsername === process.env.FIP_REPO_OWNER;
  console.log("Login from", githubUsername);
  try {
    const collaborators = await getRepoCollaborators();
    console.log(
      "Got repo collaborators:",
      collaborators.map((c) => c.login)
    );
    if (collaborators.map((c) => c.id).indexOf(githubUserId) !== -1) {
      isRepoCollaborator = true;
    }
    if (DEFAULT_REPO_COLLABORATORS.indexOf(githubUsername) !== -1) {
      isRepoCollaborator = true;
    }
  } catch (err) {
    console.log(
      "Could not get collaborators, is Metropolis installed on your Github repo?"
    );
    console.log((err as any).message);
    if (DEFAULT_REPO_COLLABORATORS.indexOf(githubUsername) !== -1) {
      isRepoCollaborator = true;
    }
  }

  const updateParams = {
    username: githubUsername,
    id: githubUserId,
    email: githubUserEmail,
    isRepoCollaborator,
  };
  console.log("Update or create Github user", updateParams);
  const { uid } = await updateOrCreateGitHubUser(updateParams);

  const token = await startSession(uid);

  try {
    await addCookies(req as any, res, token, uid);
  } catch (err) {
    return fail(res, 500, "polis_err_adding_cookies", err);
  }

  const dest = req.p.dest;
  res.redirect(dest);
}
