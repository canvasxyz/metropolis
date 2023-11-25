import sql from "sql"; // see here for useful syntax: https://github.com/brianc/node-sql/blob/bbd6ed15a02d4ab8fbc5058ee2aff1ad67acd5dc/lib/node/valueExpression.js

const sql_conversations: any = sql.define({
  name: "conversations",
  columns: [
    "zid",
    "topic",
    "description",
    "survey_caption",
    "postsurvey",
    "postsurvey_limit",
    "postsurvey_submissions",
    "postsurvey_redirect",
    "participant_count",
    "is_anon",
    "is_active",
    "is_public", // TODO remove this column
    "is_data_open",
    "github_sync_enabled",
    "fip_number",
    "fip_author",
    "fip_discussions_to",
    "fip_status",
    "fip_type",
    "fip_category",
    "fip_created",
    "fip_title",
    "profanity_filter",
    "spam_filter",
    "strict_moderation",
    "email_domain",
    "owner",
    "org_id",
    "context",
    "modified",
    "created",
    "link_url",
    "parent_url",
    "vis_type",
    "write_type",
    "importance_enabled",
    "help_type",
    "socialbtn_type",
    "subscribe_type",
    "bgcolor",
    "help_color",
    "help_bgcolor",
    "style_btn",
    "auth_needed_to_vote",
    "auth_needed_to_write",
    "auth_opt_tw",
    "auth_opt_allow_3rdparty",
  ],
});

// 'sql_comments' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.ts(7022)
// @ts-ignore
const sql_comments = sql.define({
  name: "comments",
  columns: [
    "tid",
    "zid",
    "pid",
    "uid",
    "created",
    "txt",
    "velocity",
    "active",
    "mod",
    "quote_src_url",
    "anon",
  ],
});

const sql_votes_latest_unique = sql.define({
  name: "votes_latest_unique",
  columns: ["zid", "tid", "pid", "modified", "vote", "weight", "high_priority"],
});

const sql_participant_metadata_answers = sql.define({
  name: "participant_metadata_answers",
  columns: ["pmaid", "pmqid", "zid", "value", "alive"],
});

const sql_participants_extended = sql.define({
  name: "participants_extended",
  columns: [
    "uid",
    "zid",
    "referrer",
    "parent_url",
    "created",
    "modified",

    "show_translation_activated",

    "permanent_cookie",
    "origin",
    "encrypted_ip_address",
    "encrypted_x_forwarded_for",
  ],
});

//first we define our tables
const sql_users = sql.define({
  name: "users",
  columns: ["uid", "hname", "email", "created"],
});

const sql_reports = sql.define({
  name: "reports",
  columns: [
    "rid",
    "report_id",
    "zid",
    "created",
    "modified",
    "report_name",
    "label_x_neg",
    "label_x_pos",
    "label_y_neg",
    "label_y_pos",
    "label_group_0",
    "label_group_1",
    "label_group_2",
    "label_group_3",
    "label_group_4",
    "label_group_5",
    "label_group_6",
    "label_group_7",
    "label_group_8",
    "label_group_9",
  ],
});

const SQL: any = {
  sql_conversations,
  sql_comments,
  sql_votes_latest_unique,
  sql_participant_metadata_answers,
  sql_participants_extended,
  sql_reports,
  sql_users,
};

export default SQL;
