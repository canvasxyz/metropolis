import { Response } from "express";
import { Octokit } from "@octokit/core";
import { createOAuthUserAuth } from "@octokit/auth-oauth-user";

import { queryP } from "./db/pg-query";
import { startSession } from "./session";
import cookies from "./utils/cookies";
import fail from "./utils/fail";

// this is in a separate file to server.ts so that we can use async/await
// without interfering with the legacy promise code

export async function handleGithubOauthCallback(req: { p: {uid?: any; code: string; dest?: any} }, res: Response) {
  const octokit = new Octokit({
    authStrategy: createOAuthUserAuth,
    auth: {
      clientId: process.env.GH_BASIC_CLIENT_ID,
      clientSecret: process.env.GH_BASIC_SECRET_ID,
      code: req.p.code,
    },
  });

  // get the github user that is associated with the token
  const {
    data: { login },
  } = await octokit.request("GET /user");

  const githubUsername = login;
  if(!githubUsername) {
    throw Error("invalid github access token");
  }
  console.log(`we are now authenticated as ${githubUsername}`);

  // TODO: this is a hack, we should have more semantically meaningful columns
  const email = `github: ${githubUsername}`;

  // get or create the user with this github username
  const getQuery = "select uid from users where email = $1;";
  const getRes = (await queryP(getQuery, [email])) as {uid: string}[];

  let uid: string;
  if(getRes.length > 1) {
    fail(res, 500, "polis_more_than_one_user_with_same_email");
    return;
  } else if (getRes.length == 1) {
    uid = getRes[0].uid;
    console.log(`existing user "${githubUsername}" found with uid: ${uid}`);
  } else {
    // create user
    const createQuery =
    "insert into users " +
    "(email, hname, zinvite, is_owner) VALUES " +
    "($1, $2, $3, $4) " +
    "returning uid;";
    const vals = [email, githubUsername, null, true];

    const createRes = (await queryP(createQuery, vals)) as {uid: string}[];
    uid = createRes[0].uid;
    console.log(`created user "${githubUsername}" with uid: ${uid}`);
  }

  const token = await startSession(uid);

  try {
    await cookies.addCookies(req as any, res, token, uid);
  } catch (err) {
    return fail(res, 500, "polis_err_adding_cookies", err);
  }

  const dest = req.p.dest || "http://localhost:8080";
  res.redirect(dest);
}
