import { queryP } from "../db/pg-query"

export type GitHubUserData = {
  id: number
  username: string
  email: string | null
  isRepoCollaborator?: boolean
}

/** database queries used by the github integrations */

export type FipVersionFields = {
  fip_number: number | null,
  github_pr_id: number | null,
  fip_author: string | null,
  fip_category: string | null
  fip_content: string | null,
  fip_created: string | null,
  fip_discussions_to: string | null,
  fip_files_created: string | null,
  fip_files_updated: string | null,
  fip_status: string | null,
  fip_title: string | null,
  fip_type: string | null
}

// fields in the github_prs table
export type GithubPrFields = {
  id: number
  repo_name: string
  repo_owner: string
  branch_name: string
  title: string
  submitter: string
  opened_at: string
  updated_at: string
  closed_at: string | null
  merged_at: string | null
  is_draft: boolean | undefined
}

export async function updateOrCreateGitHubUser(
  githubUserData: GitHubUserData,
): Promise<{ uid: number }> {
  const existingUser = await updateGitHubUserData(githubUserData)
  if (existingUser) {
    return existingUser
  } else {
    return await createGitHubUser(githubUserData)
  }
}

export async function createGitHubUser(
  githubUserData: GitHubUserData,
): Promise<{ uid: number }> {
  const createQuery =
    "insert into users " +
    "(github_user_id, github_username, github_email, is_repo_collaborator, is_owner) VALUES " +
    "($1, $2, $3, $4, $5) " +
    "returning uid;"
  const vals = [
    githubUserData.id,
    githubUserData.username,
    githubUserData.email,
    githubUserData.isRepoCollaborator,
    false,
  ]
  const createRes = await queryP(createQuery, vals)
  return createRes[0]
}

export async function updateGitHubUserData(
  githubUserData: GitHubUserData,
): Promise<{ uid: number }> {
  if (githubUserData.isRepoCollaborator !== undefined) {
    const updateQuery =
      "UPDATE users SET github_username = $1, github_email = $2, is_repo_collaborator = $3 WHERE github_user_id = $4 returning uid;"
    const vals = [
      githubUserData.username,
      githubUserData.email,
      githubUserData.isRepoCollaborator,
      githubUserData.id,
    ]
    const updateRes = await queryP(updateQuery, vals)
    return updateRes[0]
  } else {
    const updateQuery =
      "UPDATE users SET github_username = $1, github_email = $2 WHERE github_user_id = $3 returning uid;"
    const vals = [
      githubUserData.username,
      githubUserData.email,
      githubUserData.id,
    ]
    const updateRes = await queryP(updateQuery, vals)
    return updateRes[0]
  }
}

export async function getUserUidByGitHubUserId(
  githubUserId: number,
): Promise<{ uid: number } | undefined> {
  const query = "SELECT uid FROM users WHERE github_user_id = $1"
  const rows = await queryP(query, [githubUserId])
  if (rows.length > 1) {
    throw Error("polis_more_than_one_user_with_same_github_user_id")
  }
  return rows[0]
}

export async function isGitHubSyncEnabledforPr(prId: number) {
  const query = `
  SELECT github_sync_enabled
  FROM conversations
  JOIN fip_versions ON conversations.fip_version_id = fip_versions.id
  WHERE fip_versions.github_pr_id = $1;
  `

  const rows = await queryP(query, [prId])
  return rows[0]?.github_sync_enabled || true
}

export async function getGitHubPr(prId: number): Promise<GithubPrFields|null> {
  const query = `
  SELECT *
  FROM github_prs
  WHERE id = $1;
  `
  const rows = await queryP(query, [prId])
  return rows[0] || null
}

export async function upsertGitHubPr(data: GithubPrFields) {
  const query = `
  INSERT INTO
    github_prs
    (id, title, is_draft, closed_at, merged_at, updated_at, opened_at, submitter, branch_name, repo_name, repo_owner, sync_enabled)
  VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
  ON CONFLICT
    (id)
  DO UPDATE SET
    title = $2,
    is_draft = $3,
    closed_at = $4,
    merged_at = $5,
    updated_at = $6,
    opened_at = $7,
    submitter = $8,
    branch_name = $9,
    repo_name = $10,
    repo_owner = $11
  ;`
  const values = [
    data.id,
    data.title,
    data.is_draft,
    data.closed_at,
    data.merged_at,
    data.updated_at,
    data.opened_at,
    data.submitter,
    data.branch_name,
    data.repo_name,
    data.repo_owner,
  ]
  await queryP(query, values)
}


export async function upsertFipVersion(
  data: FipVersionFields,
): Promise<number> {
  const query = `
  INSERT INTO
    fip_versions
    (fip_number, github_pr_id, fip_author, fip_category, fip_created, fip_discussions_to, fip_files_created, fip_files_updated, fip_status, fip_title, fip_type, fip_content)
  VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  ON CONFLICT
    (fip_number, github_pr_id)
  DO UPDATE SET
    fip_author = $3,
    fip_category = $4,
    fip_created = $5,
    fip_discussions_to = $6,
    fip_files_created = $7,
    fip_files_updated = $8,
    fip_status = $9,
    fip_title = $10,
    fip_type = $11,
    fip_content = $12
  RETURNING
    id
  ;`
  const values = [
    data.fip_number,
    data.github_pr_id,
    data.fip_author,
    data.fip_category,
    data.fip_created,
    data.fip_discussions_to,
    data.fip_files_created,
    data.fip_files_updated,
    data.fip_status,
    data.fip_title,
    data.fip_type,
    data.fip_content
  ]
  const rows = await queryP(query, values)
  return rows[0].id
}

export async function updateFipVersionWithId(
  fip_version_id: number,
  data: FipVersionFields,
) {
  const query = `
  UPDATE fip_versions
  SET
    fip_number = $1,
    github_pr_id = $2,
    fip_author = $3,
    fip_category = $4,
    fip_created = $5,
    fip_discussions_to = $6,
    fip_files_created = $7,
    fip_files_updated = $8,
    fip_status = $9,
    fip_title = $10,
    fip_type = $11
  WHERE
    fip_version_id = $12
  ;`

  const values = [
    data.fip_number,
    data.github_pr_id,
    data.fip_author,
    data.fip_category,
    data.fip_created,
    data.fip_discussions_to,
    data.fip_files_created,
    data.fip_files_updated,
    data.fip_status,
    data.fip_title,
    data.fip_type,
    fip_version_id,
  ]
  await queryP(query, values)
}

export async function getConversationWithFipVersionId(fipVersionId: number) {
  const query = `
  SELECT *
  FROM conversations
  WHERE fip_version_id = $1;
  `
  const rows = await queryP(query, [fipVersionId])
  return rows[0] || null
}

export async function upsertConversation(data: {
  owner: number,
  is_active: boolean,
  is_archived: boolean,
  fip_version_id: number,
  github_sync_enabled: boolean,
}) {
  const query = `
  INSERT INTO
    conversations
    (owner, is_active, is_archived, fip_version_id, github_sync_enabled)
  VALUES
    ($1, $2, $3, $4, $5)
  ON CONFLICT
    (fip_version_id)
  DO NOTHING
  RETURNING
    zid
  ;`
  const values = [data.owner, data.is_active, data.is_archived, data.fip_version_id, data.github_sync_enabled]
  const rows = await queryP(query, values)

  if(rows.length === 0) {
    // conflict, update instead
    const updateQuery = `
      UPDATE conversations
      SET owner = $1, is_active = $2, is_archived = $3, github_sync_enabled = $5
      WHERE fip_version_id = $4
      RETURNING zid;
    `
    const updatedRows = await queryP(updateQuery, values)
    return {
      zid: updatedRows[0].zid,
      isNew: false
    }
  }

  return {
    zid: rows[0].zid,
    isNew: true
  }
}

export async function insertSyncRecord() {
  const query = `INSERT INTO github_syncs (fips_synced, prs_synced, discussions_synced) VALUES ($1, $2, $3);`
  const values = [0, 0, 0]
  return await queryP(query, values)
}

export async function getLatestSync() {
  const query = `SELECT * FROM github_syncs ORDER BY ts DESC LIMIT 1;`
  const rows = await queryP(query)
  return rows[0]
}
