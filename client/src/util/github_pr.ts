import { GitHubPr } from "./types"

const FIP_REPO_OWNER = process.env.FIP_REPO_OWNER || "filecoin-project"
const FIP_REPO_NAME = process.env.FIP_REPO_NAME || "FIPs"

export const getGitHubPrUrl = (github_pr: GitHubPr) => `https://github.com/${FIP_REPO_OWNER}/${FIP_REPO_NAME}/pull/${github_pr.id}`
