import fs from "fs/promises"
import { Octokit as OctokitRest } from "@octokit/rest"
import { Octokit } from "@octokit/core"
import { graphql } from "@octokit/graphql"
import { createAppAuth } from "@octokit/auth-app"

/**
 * functions for creating graphql and octokit clients for the github app installation
 */

export async function getGraphqlForInstallation() {
  if (!process.env.GH_APP_ID) {
    throw Error("GH_APP_ID not set")
  }

  if (!process.env.GH_APP_INSTALLATION_ID) {
    throw Error("GH_APP_INSTALLATION_ID not set")
  }

  let privateKey
  if (process.env.GH_APP_PRIVATE_KEY) {
    // use private key in environment variables
    privateKey =
      "-----BEGIN RSA PRIVATE KEY-----\n" +
      process.env.GH_APP_PRIVATE_KEY +
      "\n-----END RSA PRIVATE KEY-----"
  } else if (process.env.GH_APP_PRIVATE_KEY_PATH) {
    // open pem file
    privateKey = await fs.readFile(process.env.GH_APP_PRIVATE_KEY_PATH, "utf8")
  } else {
    throw Error("GH_APP_PRIVATE_KEY and GH_APP_PRIVATE_KEY_PATH not set")
  }

  const auth = createAppAuth({
    appId: process.env.GH_APP_ID,
    privateKey,
    installationId: process.env.GH_APP_INSTALLATION_ID,
  })

  const graphqlWithAuth = graphql.defaults({
    request: {
      hook: auth.hook,
    },
  })

  return graphqlWithAuth
}

export async function getOctoKitForInstallation() {
  if (!process.env.GH_APP_ID) {
    throw Error("GH_APP_ID not set")
  }

  if (!process.env.GH_APP_INSTALLATION_ID) {
    throw Error("GH_APP_INSTALLATION_ID not set")
  }

  let privateKey
  if (process.env.GH_APP_PRIVATE_KEY) {
    // use private key in environment variables
    privateKey =
      "-----BEGIN RSA PRIVATE KEY-----\n" +
      process.env.GH_APP_PRIVATE_KEY +
      "\n-----END RSA PRIVATE KEY-----"
  } else if (process.env.GH_APP_PRIVATE_KEY_PATH) {
    // open pem file
    privateKey = await fs.readFile(process.env.GH_APP_PRIVATE_KEY_PATH, "utf8")
  } else {
    throw Error("GH_APP_PRIVATE_KEY and GH_APP_PRIVATE_KEY_PATH not set")
  }

  return new OctokitRest({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GH_APP_ID,
      privateKey,
      installationId: process.env.GH_APP_INSTALLATION_ID,
    },
  })
}

export async function getRepoCollaborators() {
  const installationOctokit = await getOctoKitForInstallation()

  if (!process.env.FIP_REPO_OWNER) {
    throw Error("FIP_REPO_OWNER not set")
  }

  if (!process.env.FIP_REPO_NAME) {
    throw Error("FIP_REPO_NAME not set")
  }

  const { data } = await installationOctokit.request(
    "GET /repos/{owner}/{repo}/collaborators",
    {
      repo: process.env.FIP_REPO_NAME,
      owner: process.env.FIP_REPO_OWNER,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  )

  return data
}
