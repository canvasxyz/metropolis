import { queryP } from "../db/pg-query";

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
];

// fields that come from the FIP
export type FipFields = {
  description: string;
  fip_number?: number;
  fip_title?: string;
  fip_author?: string;
  fip_discussions_to?: string;
  fip_status?: string;
  fip_type?: string;
  fip_category?: string;
  fip_created?: string;
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
];

export async function getOrCreateUserWithGithubUsername(
  githubUsername: string,
): Promise<{ uid: number }> {
  const existingUser = await getUserUidByGithubUsername(githubUsername);
  if (existingUser) {
    return existingUser;
  } else {
    return await createUserWithGithubUsername(githubUsername);
  }
}

export async function createUserWithGithubUsername(
  githubUsername: string,
): Promise<{ uid: number }> {
  const createQuery =
    "insert into users " +
    "(github_username, hname, zinvite, is_owner) VALUES " +
    "($1, $2, $3, $4) " +
    "returning uid;";
  const vals = [githubUsername, githubUsername, null, true];
  const createRes = await queryP(createQuery, vals);
  return createRes[0];
}

export async function getUserUidByGithubUsername(
  githubUsername: string,
): Promise<{ uid: number } | undefined> {
  const query = "SELECT uid FROM users WHERE github_username = $1";
  // TODO: this is a hack, we should have more semantically meaningful columns
  const rows = await queryP(query, [githubUsername]);
  if (rows.length > 1) {
    throw Error("polis_more_than_one_user_with_same_github_username");
  }
  return rows[0];
}

export async function getConversationByPrId(
  prId: number,
): Promise<(PrFields & { github_sync_enabled: boolean }) | undefined> {
  const query = `SELECT ${[...PR_FIELDS, "github_sync_enabled"].join(
    ", ",
  )} FROM conversations WHERE github_pr_id = $1;`;
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
