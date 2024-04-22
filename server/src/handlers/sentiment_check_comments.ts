import { Request, Response } from "express";
import { queryP_readOnly } from "../db/pg-query";
import fail from "../utils/fail";


export async function handle_GET_conversation_sentiment_comments (req: Request, res: Response) {
  // make sure that this query does not return the zid
  const query = "SELECT id, comment, uid, created FROM sentiment_check_comments WHERE zid = $1 ORDER BY created ASC;";

  let result;
  try {
    result = await queryP_readOnly(query.toString(), [req.p.zid]);
  } catch (err) {
    fail(res, 500, "polis_err_get_conversation_sentiment_comments", err);
    return;
  }

  res.status(200).json(result);
}

export async function handle_POST_conversation_sentiment_check_comments (req: Request, res: Response) {
  const query = "INSERT INTO sentiment_check_comments (zid, uid, comment) VALUES ($1, $2, $3) RETURNING *;";

  let result;
  try {
    result = await queryP_readOnly(query.toString(), [req.p.zid, req.p.uid, req.p.comment]);
  } catch (err) {
    fail(res, 500, "polis_err_post_conversation_sentiment_check_comments", err);
    return;
  }

  res.status(201).json(result);
}

// export async function handle_PUT_conversation_sentiment_check_comments (req: Request, res: Response) {}
// export async function handle_DELETE_conversation_sentiment_check_comments (req: Request, res: Response) {}
