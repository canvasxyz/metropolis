import { queryP } from "../db/pg-query";

export type GitHubUserData = {
  id: number;
  username: string;
  email: string | null;
  isRepoCollaborator: boolean;
};

/** database queries used by the github integrations */

// fields that come from the PR
export type PrFields = {
  owner: number;
  github_pr_id: number;
  is_active: boolean;
  is_archived: boolean;
  github_repo_name: string;
  github_repo_owner: string;
  github_branch_name: string;
  github_pr_title: string;
  github_pr_submitter: string;
  github_pr_opened_at: string;
  github_pr_updated_at: string;
  github_pr_closed_at: string | null;
  github_pr_merged_at: string | null;
  github_pr_is_draft: boolean | undefined;
};

const PR_FIELDS: (keyof PrFields)[] = [
  "github_pr_id",
  "owner",
  "is_active",
  "github_repo_name",
  "github_repo_owner",
  "github_branch_name",
  "github_pr_title",
  "github_pr_submitter",
  "github_pr_opened_at",
  "github_pr_updated_at",
  "github_pr_closed_at",
  "github_pr_merged_at",
  "github_pr_is_draft",
];

// fields that come from the FIP
export type FipFields = {
  description?: string;
  fip_number?: number;
  fip_title?: string;
  fip_author?: string;
  fip_discussions_to?: string;
  fip_status?: string;
  fip_type?: string;
  fip_category?: string;
  fip_created?: string;
  fip_files_created?: string;
  fip_files_updated?: string;
};

const FIP_FIELDS: (keyof FipFields)[] = [
  "description",
  "fip_number",
  "fip_title",
  "fip_author",
  "fip_discussions_to",
  "fip_status",
  "fip_type",
  "fip_category",
  "fip_created",
  "fip_files_created",
  "fip_files_updated",
];

export async function updateOrCreateGitHubUser(
  githubUserData: GitHubUserData,
): Promise<{ uid: number }> {
  const existingUser = await updateGitHubUserData(githubUserData);
  if (existingUser) {
    return existingUser;
  } else {
    return await createGitHubUser(githubUserData);
  }
}

export async function createGitHubUser(
  githubUserData: GitHubUserData,
): Promise<{ uid: number }> {
  const createQuery =
    "insert into users " +
    "(github_user_id, github_username, github_email, is_repo_collaborator, is_owner) VALUES " +
    "($1, $2, $3, $4, $5) " +
    "returning uid;";
  const vals = [
    githubUserData.id,
    githubUserData.username,
    githubUserData.email,
    githubUserData.isRepoCollaborator,
    false,
  ];
  const createRes = await queryP(createQuery, vals);
  return createRes[0];
}

export async function updateGitHubUserData(
  githubUserData: GitHubUserData,
): Promise<{ uid: number }> {
  const createQuery =
    "UPDATE users SET github_username = $1, github_email = $2, is_repo_collaborator = $3 WHERE github_user_id = $4" +
    " returning uid;";
  const vals = [
    githubUserData.username,
    githubUserData.email,
    githubUserData.isRepoCollaborator,
    githubUserData.id,
  ];
  const updateRes = await queryP(createQuery, vals);
  return updateRes[0];
}

export async function getUserUidByGithubUserId(
  githubUserId: number,
): Promise<{ uid: number } | undefined> {
  const query = "SELECT uid FROM users WHERE github_user_id = $1";
  const rows = await queryP(query, [githubUserId]);
  if (rows.length > 1) {
    throw Error("polis_more_than_one_user_with_same_github_user_id");
  }
  return rows[0];
}

export async function getConversationByPrId(
  prId: number,
): Promise<
  (PrFields & { github_sync_enabled: boolean; zinvite: string }) | undefined
> {
  const query = `SELECT ${[
    ...PR_FIELDS,
    "github_sync_enabled",
    "zinvites.zinvite",
  ].join(
    ", ",
  )} FROM conversations LEFT JOIN zinvites ON conversations.zid = zinvites.zid WHERE github_pr_id = $1;`;
  const rows = await queryP(query, [prId]);
  return rows[0];
}

export async function insertConversationPrAndFip(
  data: PrFields & FipFields,
): Promise<{ zid: number }[]> {
  const fields = [...PR_FIELDS, ...FIP_FIELDS];
  const fieldPlaceholders = fields.map((_, i) => `$${i + 1}`).join(", ");
  const query = `INSERT INTO conversations (${fields.join(
    ", ",
  )}) VALUES (${fieldPlaceholders}) RETURNING zid;`;
  const values = fields.map((field) => data[field] ?? null);
  return await queryP(query, values);
}

export async function updateConversationPrAndFip(data: PrFields & FipFields) {
  const fields = [...PR_FIELDS, ...FIP_FIELDS];
  const fieldAssignments = fields
    .map((field, i) => `${field} = $${i + 1}`)
    .join(", ");
  const query = `UPDATE conversations SET ${fieldAssignments} WHERE github_pr_id = $${
    fields.length + 1
  };`;
  const values = [
    ...fields.map((field) => data[field] ?? null),
    data.github_pr_id,
  ];
  return await queryP(query, values);
}

export async function updateConversationPr(data: PrFields) {
  const fields = PR_FIELDS;
  const fieldAssignments = fields
    .map((field, i) => `${field} = $${i + 1}`)
    .join(", ");
  const query = `UPDATE conversations SET ${fieldAssignments} WHERE github_pr_id = $${
    fields.length + 1
  };`;
  const values = [
    ...fields.map((field) => data[field] ?? null),
    data.github_pr_id,
  ];
  return await queryP(query, values);
}

export async function insertSyncRecord() {
  const query = `INSERT INTO github_syncs (fips_synced, prs_synced, discussions_synced) VALUES ($1, $2, $3);`;
  const values = [0, 0, 0];
  return await queryP(query, values);
}

export async function getLatestSync() {
  const query = `SELECT * FROM github_syncs ORDER BY ts DESC LIMIT 1;`;
  const rows = await queryP(query);
  return rows[0];
}
