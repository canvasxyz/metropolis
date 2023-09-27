// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

"use strict";

import { parse } from "json2csv";
import akismetLib from "akismet";
import AWS from "aws-sdk";
import badwords from "badwords/object";
import async from "async";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import responseTime from "response-time";
import request from "request-promise"; // includes Request, but adds promise methods
import LruCache from "lru-cache";
import timeout from "connect-timeout";
import zlib from "zlib";
import _ from "underscore";
import pg from "pg";

import { addInRamMetric, meteredPromise } from "./utils/metered";
import CreateUser from "./auth/create-user";
import Password from "./auth/password";
import dbPgQuery from "./db/pg-query";

import Config from "./config";
import fail from "./utils/fail";

import {handleGithubOauthCallback} from "./github_auth";

import {
  Body,
  DetectLanguageResult,
  Headers,
  Query,
  AuthRequest,
  ParticipantInfo,
  PidReadyResult,
  CommentOptions,
  ParticipantFields,
  ParticipantCommentModerationResult,
  UserType,
  ConversationType,
  CommentType,
  ParticipantOption,
  DemographicEntry,
  Demo,
  Vote,
} from "./d";

AWS.config.update({ region: Config.awsRegion });
const devMode = Config.isDevMode;
// Property 'Client' does not exist on type '{ query: (...args: any[]) => void; query_readOnly:
// (...args: any[]) => void; queryP: (...args: any[]) => Promise<unknown>; queryP_metered:
// (name: any, queryString: any, params: any) => any; queryP_metered_readOnly:
// (name: any, queryString: any, params: any) => any; queryP_readOnly:
// (...args: any[]) => Promise <...>; ...'.ts(2339)
// @ts-ignore
const escapeLiteral = pg.Client.prototype.escapeLiteral;
const pgQuery = dbPgQuery.query;
const pgQuery_readOnly = dbPgQuery.query_readOnly;
const pgQueryP = dbPgQuery.queryP;
const pgQueryP_metered = dbPgQuery.queryP_metered;
const pgQueryP_readOnly = dbPgQuery.queryP_readOnly;
const pgQueryP_readOnly_wRetryIfEmpty = dbPgQuery.queryP_readOnly_wRetryIfEmpty;
const generateAndRegisterZinvite = CreateUser.generateAndRegisterZinvite;
const generateToken = Password.generateToken;
const generateTokenP = Password.generateTokenP;

// TODO: Maybe able to remove
import { generateHashedPassword } from "./auth/password";
import cookies from "./utils/cookies";
const COOKIES = cookies.COOKIES;
const COOKIES_TO_CLEAR = cookies.COOKIES_TO_CLEAR;

import constants from "./utils/constants";
const DEFAULTS = constants.DEFAULTS;

import User from "./user";
import Conversation from "./conversation";
import Session from "./session";
import Comment from "./comment";
import Utils from "./utils/common";
import SQL from "./db/sql";
// End of re-import
import logger from "./utils/logger";

// # notifications
import emailSenders from "./email/senders";
import { Request, Response } from "express";
import { token } from "morgan";
const sendTextEmail = emailSenders.sendTextEmail;

const adminEmails = Config.adminEmails ? JSON.parse(Config.adminEmails) : [];

const polisDevs = Config.adminUIDs ? JSON.parse(Config.adminUIDs) : [];

function isPolisDev(uid?: any) {
  return polisDevs.indexOf(uid) >= 0;
}

const polisFromAddress = Config.polisFromAddress;

const serverUrl = Config.getServerUrl(); // typically https://pol.is or http://localhost:8040

let akismet = akismetLib.client({
  blog: serverUrl,
  apiKey: Config.akismetAntispamApiKey,
});

akismet.verifyKey(function (err: any, verified: any) {
  if (verified) {
    logger.debug("Akismet: API key successfully verified.");
  } else {
    logger.debug("Akismet: Unable to verify API key.");
  }
});
// let SELF_HOSTNAME = Config.getServerHostname();

function isSpam(o: {
  comment_content: any;
  comment_author: any;
  permalink: string;
  user_ip: any;
  user_agent: any;
  referrer: any;
}) {
  return meteredPromise(
    "isSpam",
    new Promise((resolve, reject) => {
      akismet.checkSpam(o, function (err: any, spam: any) {
        if (err) {
          reject(err);
        } else {
          resolve(spam);
        }
      });
    })
  );
}

// basic defaultdict implementation
function DD(this: any, f: () => { votes: number; comments: number }) {
  this.m = {};
  this.f = f;
}
// basic defaultarray implementation
function DA(this: any, f: any) {
  this.m = [];
  this.f = f;
}
DD.prototype.g = DA.prototype.g = function (k: string | number) {
  if (this.m.hasOwnProperty(k)) {
    return this.m[k];
  }
  let v = this.f(k);
  this.m[k] = v;
  return v;
};
DD.prototype.s = DA.prototype.s = function (k: string | number, v: any) {
  this.m[k] = v;
};

const domainOverride = Config.domainOverride;

function haltOnTimeout(req: { timedout: any }, res: any, next: () => void) {
  if (req.timedout) {
    fail(res, 500, "polis_err_timeout_misc");
  } else {
    next();
  }
}

function ifDefinedSet(
  name: string,
  source: { [x: string]: any },
  dest: { [x: string]: any }
) {
  if (!_.isUndefined(source[name])) {
    dest[name] = source[name];
  }
}

const sql_votes_latest_unique = SQL.sql_votes_latest_unique;
const sql_conversations = SQL.sql_conversations;
const sql_participant_metadata_answers = SQL.sql_participant_metadata_answers;
const sql_participants_extended = SQL.sql_participants_extended;
const sql_reports = SQL.sql_reports;
const sql_users = SQL.sql_users;

// // Eventually, the plan is to support a larger number-space by using some lowercase letters.
// // Waiting to implement that since there's cognitive overhead with mapping the IDs to/from
// // letters/numbers.
// // Just using digits [2-9] to start with. Omitting 0 and 1 since they can be confused with
// // letters once we start using letters.
// // This should give us roughly 8^8 = 16777216 conversations before we have to add letters.
// let ReadableIds = (function() {
//     function rand(a) {
//         return _.random(a.length);
//     }
//     // no 1 (looks like l)
//     // no 0 (looks like 0)
//     let numbers8 = "23456789".split("");

//     // should fit within 32 bits
//     function generateConversationId() {
//        return [
//             rand(numbers8),
//             rand(numbers8),
//             rand(numbers8),
//             rand(numbers8),
//             rand(numbers8),
//             rand(numbers8),
//             rand(numbers8),
//             rand(numbers8)
//         ].join('');
//     }
//     return {
//         generateConversationId: generateConversationId,
//     };
// }());

const encrypt = Session.encrypt;
const decrypt = Session.decrypt;
const makeSessionToken = Session.makeSessionToken;
const getUserInfoForSessionToken = Session.getUserInfoForSessionToken;
const startSession = Session.startSession;
const endSession = Session.endSession;
const setupPwReset = Session.setupPwReset;
const getUidForPwResetToken = Session.getUidForPwResetToken;
const clearPwResetToken = Session.clearPwResetToken;

function getUidForApiKey(apikey: any) {
  return pgQueryP_readOnly_wRetryIfEmpty(
    "select uid from apikeysndvweifu WHERE apikey = ($1);",
    [apikey]
  );
}
// http://en.wikipedia.org/wiki/Basic_access_authentication#Client_side
function doApiKeyBasicAuth(
  assigner: any,
  header: string,
  isOptional: any,
  req: any,
  res: any,
  next: (err: any) => void
) {
  let token = header.split(/\s+/).pop() || "", // and the encoded auth token
    auth = Buffer.from(token, "base64").toString(), // convert from base64
    parts = auth.split(/:/), // split on colon
    username = parts[0],
    // password = parts[1], // we don't use the password part (just use "apikey:")
    apikey = username;
  return doApiKeyAuth(assigner, apikey, isOptional, req, res, next);
}

function doApiKeyAuth(
  assigner: (arg0: any, arg1: string, arg2: number) => void,
  apikey: string,
  isOptional: any,
  req: any,
  res: { status: (arg0: number) => void },
  next: { (err: any): void; (err: any): void; (arg0?: string): void }
) {
  getUidForApiKey(apikey)
    .then(function (rows: string | any[]) {
      if (!rows || !rows.length) {
        res.status(403);
        next("polis_err_auth_no_such_api_token");
        return;
      }
      assigner(req, "uid", Number(rows[0].uid));
      next();
    })
    .catch(function (err: any) {
      res.status(403);
      logger.error("polis_err_auth_no_such_api_token2", err);
      next("polis_err_auth_no_such_api_token2");
    });
}

// function getXidRecordByXidConversationId(xid, conversation_id) {
//   return pgQueryP("select * from xids where xid = ($2) and owner = (select org_id from conversations where zid = (select zid from zinvites where zinvite = ($1)))", [zinvite, xid]);
// }

const createDummyUser = User.createDummyUser;
const getConversationInfo = Conversation.getConversationInfo;
const getConversationInfoByConversationId =
  Conversation.getConversationInfoByConversationId;
const isXidWhitelisted = Conversation.isXidWhitelisted;
const getXidRecordByXidOwnerId = User.getXidRecordByXidOwnerId;

// function doXidOwnerConversationIdAuth(assigner, xid, conversation_id, req, res, next) {
//   getXidRecordByXidConversationId(xid, conversation_id).then(function(rows) {
//     if (!rows || !rows.length) {
//       res.status(403);
//       next("polis_err_auth_no_such_api_token4");
//       return;
//     }
//     assigner(req, "uid", Number(rows[0].uid));
//     next();
//   });
// }

function doXidApiKeyAuth(
  assigner: (arg0: any, arg1: string, arg2: number) => void,
  apikey: any,
  xid: any,
  isOptional: any,
  req: AuthRequest,
  res: { status: (arg0: number) => void },
  next: {
    (err: any): void;
    (err: any): void;
    (arg0?: string | undefined): void;
  }
) {
  getUidForApiKey(apikey)
    .then(
      function (rows: string | any[]) {
        if (!rows || !rows.length) {
          res.status(403);
          next("polis_err_auth_no_such_api_token4");
          return;
        }
        let uidForApiKey = Number(rows[0].uid);
        return getXidRecordByXidOwnerId(
          xid,
          uidForApiKey,
          void 0, //zid_optional,
          req.body.x_profile_image_url || req?.query?.x_profile_image_url,
          req.body.x_name || req?.query?.x_name || null,
          req.body.x_email || req?.query?.x_email || null,
          !!req.body.agid || !!req?.query?.agid || null
        ).then((rows: string | any[] | null) => {
          if (!rows || !rows.length) {
            if (isOptional) {
              return next();
            } else {
              res.status(403);
              next("polis_err_auth_no_such_xid_for_this_apikey_1");
              return;
            }
          }
          let uidForCurrentUser = Number(rows[0].uid);
          assigner(req, "uid", uidForCurrentUser);
          assigner(req, "xid", xid);
          assigner(req, "owner_uid", uidForApiKey);
          assigner(req, "org_id", uidForApiKey);
          next();
        });
      },
      function (err: any) {
        res.status(403);
        logger.error("polis_err_auth_no_such_api_token3", err);
        next("polis_err_auth_no_such_api_token3");
      }
    )
    .catch(function (err: any) {
      res.status(403);
      logger.error("polis_err_auth_misc_23423", err);
      next("polis_err_auth_misc_23423");
    });
}
function doHeaderAuth(
  assigner: (arg0: any, arg1: string, arg2: number) => void,
  isOptional: any,
  req: { headers?: { [x: string]: any }; body: { uid?: any } },
  res: { status: (arg0: number) => void },
  next: { (err: any): void; (arg0?: string | undefined): void }
) {
  let token = "";
  if (req && req.headers) token = req?.headers?.["x-polis"];

  //if (req.body.uid) { next(401); return; } // shouldn't be in the post - TODO - see if we can do the auth in parallel for non-destructive operations
  getUserInfoForSessionToken(token).then((uid: any) => {
    if (req.body.uid && req.body.uid !== uid) {
      res.status(401);
      next("polis_err_auth_mismatch_uid");
    } else {
      assigner(req, "uid", Number(uid));
      next();
    }
  }).catch(() => {
    res.status(403);
    next("polis_err_auth_no_such_token");
  });
}

// Property 'hashCode' does not exist on type 'String'.ts(2339)
// @ts-ignore
String.prototype.hashCode = function () {
  let hash = 0;
  let i;
  let character;
  if (this.length === 0) {
    return hash;
  }
  for (i = 0; i < this.length; i++) {
    character = this.charCodeAt(i);
    hash = (hash << 5) - hash + character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};


// // If there are any comments which have no votes by the owner, create a PASS vote by the owner.
// pgQuery("select * from comments", [], function(err, comments) {
//     pgQuery("select * from votes", [], function(err, votes) {
//         comments = comments.rows;
//         votes = votes.rows;

//         let exists = {};
//         votes.forEach(function(v) {
//             exists[v.zid +"_"+ v.tid] = true;
//         });
//         let missing = [];
//         for (var i = 0 ; i < comments.length; i++) {
//             let c = comments[i];
//             if (!exists[c.zid + "_" + c.tid]) {
//                 missing.push(c);
//             }
//         }
//         async.series(
//             missing.map(function(c) {
//                 return function(callback) {
//                     votesPost(uid, c.pid, c.zid, c.tid, 0)
//                         .then(function() {
//                             callback(null);
//                         })
//                         .catch(function() {
//                             callback(1);
//                         });
//                 };
//             }),
//             function(err, results) {
//             });
//     });
// });

const polisTypes = Utils.polisTypes;
const setCookie = cookies.setCookie;
const setPermanentCookie = cookies.setPermanentCookie;
const setCookieTestCookie = cookies.setCookieTestCookie;
const addCookies = cookies.addCookies;
const getPermanentCookieAndEnsureItIsSet =
  cookies.getPermanentCookieAndEnsureItIsSet;

const pidCache = User.pidCache;
const getPid = User.getPid;
const getPidPromise = User.getPidPromise;
const getPidForParticipant = User.getPidForParticipant;

function recordPermanentCookieZidJoin(permanentCookieToken: any, zid: any) {
  function doInsert() {
    return pgQueryP(
      "insert into permanentCookieZidJoins (cookie, zid) values ($1, $2);",
      [permanentCookieToken, zid]
    );
  }
  return pgQueryP(
    "select zid from permanentCookieZidJoins where cookie = ($1) and zid = ($2);",
    [permanentCookieToken, zid]
  ).then(
    function (rows: string | any[]) {
      if (rows && rows.length) {
        // already there
      } else {
        return doInsert();
      }
    },
    function (err: any) {
      logger.error("error in recordPermanentCookieZidJoin", err);
      // hmm, weird, try inserting anyway
      return doInsert();
    }
  );
}

const detectLanguage = Comment.detectLanguage;

if (Config.backfillCommentLangDetection) {
  pgQueryP("select tid, txt, zid from comments where lang is null;", []).then(
    (comments: string | any[]) => {
      let i = 0;
      function doNext() {
        if (i < comments.length) {
          let c = comments[i];
          i += 1;
          detectLanguage(c.txt).then((x: DetectLanguageResult[]) => {
            const firstResult = x[0];
            logger.debug("backfill " + firstResult.language + "\t\t" + c.txt);
            pgQueryP(
              "update comments set lang = ($1), lang_confidence = ($2) where zid = ($3) and tid = ($4)",
              [firstResult.language, firstResult.confidence, c.zid, c.tid]
            ).then(() => {
              doNext();
            });
          });
        }
      }
      doNext();
    }
  );
}

function doVotesPost(
  uid?: any,
  pid?: any,
  conv?: { zid: any },
  tid?: any,
  voteType?: any,
  weight?: number,
  high_priority?: boolean
) {
  let zid = conv?.zid;
  weight = weight || 0;
  let weight_x_32767 = Math.trunc(weight * 32767); // weight is stored as a SMALLINT, so convert from a [-1,1] float to [-32767,32767] int
  return new Promise(function (
    resolve: (arg0: { conv: any; vote: any }) => void,
    reject: (arg0: string) => void
  ) {
    let query =
      "INSERT INTO votes (pid, zid, tid, vote, weight_x_32767, high_priority, created) VALUES ($1, $2, $3, $4, $5, $6, default) RETURNING *;";
    let params = [pid, zid, tid, voteType, weight_x_32767, high_priority];
    pgQuery(query, params, function (err: any, result: { rows: any[] }) {
      if (err) {
        if (isDuplicateKey(err)) {
          reject("polis_err_vote_duplicate");
        } else {
          logger.error("polis_err_vote_other", err);
          reject("polis_err_vote_other");
        }
        return;
      }

      const vote = result.rows[0];

      resolve({
        conv: conv,
        vote: vote,
      });
    });
  });
}

function votesPost(
  uid?: any,
  pid?: any,
  zid?: any,
  tid?: any,
  voteType?: any,
  weight?: number,
  high_priority?: boolean
) {
  return (
    pgQueryP_readOnly("select * from conversations where zid = ($1);", [zid])
      .then(function (rows: string | any[]) {
        if (!rows || !rows.length) {
          throw "polis_err_unknown_conversation";
        }
        let conv = rows[0];
        if (!conv.is_active) {
          throw "polis_err_conversation_is_closed";
        }
        if (conv.auth_needed_to_vote) {
          return isModerator(zid, uid).then((is_mod: any) => {
            if (is_mod) {
              return conv;
            }
            return Promise.all([
              pgQueryP(
                "select * from xids where owner = ($1) and uid = ($2);",
                [conv.owner, uid]
              ),
              getSocialInfoForUsers([uid], zid),
            ]).then(([xids, info]) => {
              var socialAccountIsLinked = info.length > 0;
              var hasXid = xids.length > 0;
              if (socialAccountIsLinked || hasXid) {
                return conv;
              } else {
                throw "polis_err_post_votes_social_needed";
              }
            });
          });
        }
        return conv;
      })
      .then(function (conv: any) {
        return doVotesPost(
          uid,
          pid,
          conv,
          tid,
          voteType,
          weight,
          high_priority
        );
      })
  );
}
function getVotesForSingleParticipant(p: { pid: any }) {
  if (_.isUndefined(p.pid)) {
    return Promise.resolve([]);
  }
  return votesGet(p);
}

function votesGet(p: { zid?: any; pid?: any; tid?: any }): Promise<any[]> {
  return meteredPromise("votesGet", new Promise((resolve, reject) => {
    let q = sql_votes_latest_unique
      .select(sql_votes_latest_unique.star())
      .where(sql_votes_latest_unique.zid.equals(p.zid));

    if (!_.isUndefined(p.pid)) {
      q = q.where(sql_votes_latest_unique.pid.equals(p.pid));
    }
    if (!_.isUndefined(p.tid)) {
      q = q.where(sql_votes_latest_unique.tid.equals(p.tid));
    }
    pgQuery_readOnly(
      q.toString(),
      function (err: any, results: { rows: any }) {
        if (err) {
          reject(err);
        } else {
          resolve(results.rows);
        }
      }
    );
  }));
} // End votesGet

function writeDefaultHead(
  req: any,
  res: {
    set: (arg0: {
      "Content-Type": string;
      "Cache-Control": string;
      Connection: string;
    }) => void;
  },
  next: () => void
) {
  res.set({
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    //    'Access-Control-Allow-Origin': '*',
    //    'Access-Control-Allow-Credentials': 'true'
  });
  next();
}

function redirectIfNotHttps(
  req: Request,
  res: Response,
  next: () => any
) {
  let exempt = devMode;

  // IE is picky, so use HTTP.
  // TODO figure out IE situation, (proxy static files in worst-case)
  // exempt = exempt || /MSIE/.test(req?.headers?.['user-agent']); // TODO test IE11

  if (exempt) {
    return next();
  }

  const isHttps = req?.headers?.["x-forwarded-proto"] === "https";

  if (!isHttps) {
    // assuming we're running on Heroku, where we're behind a proxy.
    res.writeHead(302, {
      Location: "https://" + req?.headers?.host + req.url,
    });
    return res.end();
  }
  return next();
}

// function createDummyUsersBatch(n) {
//     let query = "insert into users (created) values ";
//     let values = [];
//     for (var i = 0; i < n; i++) {
//         values.push("(default)");
//     }
//     values = values.join(",");
//     query += values;
//     query += " returning uid;";

//     return meteredPromise("createDummyUser", new Promise(function(resolve, reject) {
//         pgQuery(query,[], function(err, results) {
//             if (err || !results || !results.rows || !results.rows.length) {
//                 reject(new Error("polis_err_create_empty_user"));
//                 return;
//             }
//             let uids = results.rows.map(function(row) {
//                 return row.uid;
//             });
//             resolve(uids);
//         });
//     }));
// }

function doXidConversationIdAuth(
  assigner: (arg0: any, arg1: string, arg2: number) => void,
  xid: any,
  conversation_id: any,
  isOptional: any,
  req: AuthRequest,
  res: { status: (arg0: number) => void },
  onDone: { (err: any): void; (arg0?: string): void }
) {
  return getConversationInfoByConversationId(conversation_id)
    .then((conv: { org_id: any; zid: any }) => {
      return getXidRecordByXidOwnerId(
        xid,
        conv.org_id,
        conv.zid,
        req.body.x_profile_image_url || req?.query?.x_profile_image_url,
        req.body.x_name || req?.query?.x_name || null,
        req.body.x_email || req?.query?.x_email || null,
        !!req.body.agid || !!req?.query?.agid || null
      ).then((rows: string | any[] | null) => {
        if (!rows || !rows.length) {
          if (isOptional) {
            return onDone();
          } else {
            res.status(403);
            onDone("polis_err_auth_no_such_xid_for_this_apikey_11");
            return;
          }
        }
        let uidForCurrentUser = Number(rows[0].uid);
        assigner(req, "uid", uidForCurrentUser);
        onDone();
      });
    })
    .catch((err: any) => {
      logger.error("doXidConversationIdAuth error", err);
      onDone(err);
    });
}
function _auth(assigner: any, isOptional: boolean) {
  function getKey(
    req: {
      body: Body;
      headers?: Headers;
      query?: Query;
    },
    key: string
  ) {
    return req.body[key] || req?.headers?.[key] || req?.query?.[key];
  }

  function doAuth(
    req: {
      cookies: { [x: string]: any };
      headers?: { [x: string]: any; authorization: any };
      p: { uid?: any };
      body: Body;
    },
    res: { status: (arg0: number) => void }
  ) {
    //var token = req.body.token;
    let token = req.cookies[COOKIES.TOKEN];
    let xPolisToken = req?.headers?.["x-polis"];

    return new Promise(function (
      resolve: (arg0: any) => void,
      reject: (arg0: string) => void
    ) {
      function onDone(err?: string) {
        if (err) {
          reject(err);
        }
        if ((!req.p || !req.p.uid) && !isOptional) {
          reject("polis_err_mandatory_auth_unsuccessful");
        }
        resolve(req.p && req.p.uid);
      }
      if (xPolisToken) {
        logger.info("authtype: doHeaderAuth");
        doHeaderAuth(assigner, isOptional, req, res, onDone);
      } else if (getKey(req, "polisApiKey") && getKey(req, "ownerXid")) {
        doXidApiKeyAuth(
          assigner,
          getKey(req, "polisApiKey"),
          getKey(req, "ownerXid"),
          isOptional,
          req,
          res,
          onDone
        );
      } else if (getKey(req, "polisApiKey") && getKey(req, "xid")) {
        doXidApiKeyAuth(
          assigner,
          getKey(req, "polisApiKey"),
          getKey(req, "xid"),
          isOptional,
          req,
          res,
          onDone
        );
        // } else if (req?.headers?.["x-sandstorm-app-polis-apikey"] && req?.headers?.["x-sandstorm-app-polis-xid"] && req?.headers?.["x-sandstorm-app-polis-owner-xid"]) {
        //   doXidApiKeyAuth(
        //     assigner,
        //     req?.headers?.["x-sandstorm-app-polis-apikey"],
        //     req?.headers?.["x-sandstorm-app-polis-owner-xid"],
        //     req?.headers?.["x-sandstorm-app-polis-xid"],
        //     isOptional, req, res, onDone);
      } else if (getKey(req, "xid") && getKey(req, "conversation_id")) {
        doXidConversationIdAuth(
          assigner,
          getKey(req, "xid"),
          getKey(req, "conversation_id"),
          isOptional,
          req,
          res,
          onDone
        );
      } else if (req?.headers?.["x-sandstorm-app-polis-apikey"]) {
        doApiKeyAuth(
          assigner,
          req?.headers?.["x-sandstorm-app-polis-apikey"],
          isOptional,
          req,
          res,
          onDone
        );
      } else if (req.body["polisApiKey"]) {
        doApiKeyAuth(
          assigner,
          getKey(req, "polisApiKey"),
          isOptional,
          req,
          res,
          onDone
        );
      } else if (token) {
        doCookieAuth(assigner, isOptional, req, res, onDone);
      } else if (req?.headers?.authorization) {
        doApiKeyBasicAuth(
          assigner,
          req.headers.authorization,
          isOptional,
          req,
          res,
          onDone
        );
      } else if (req.body.agid) {
        // Auto Gen user  ID
        createDummyUser()
          .then(
            function (uid?: any) {
              let shouldAddCookies = _.isUndefined(req.body.xid);
              if (!shouldAddCookies) {
                req.p = req.p || {};
                req.p.uid = uid;
                return onDone();
              }
              return startSessionAndAddCookies(req, res, uid).then(
                function () {
                  req.p = req.p || {};
                  req.p.uid = uid;
                  onDone();
                },
                function (err: any) {
                  res.status(500);
                  logger.error("polis_err_auth_token_error_2343", err);
                  onDone("polis_err_auth_token_error_2343");
                }
              );
            },
            function (err: any) {
              res.status(500);
              logger.error("polis_err_auth_token_error_1241", err);
              onDone("polis_err_auth_token_error_1241");
            }
          )
          .catch(function (err: any) {
            res.status(500);
            logger.error("polis_err_auth_token_error_5345", err);
            onDone("polis_err_auth_token_error_5345");
          });
      } else if (isOptional) {
        onDone(); // didn't create user
      } else {
        res.status(401);
        onDone("polis_err_auth_token_not_supplied");
      }
    });
  }
  return function (
    req: any,
    res: { status: (arg0: number) => void },
    next: (arg0?: undefined) => void
  ) {
    doAuth(req, res)
      .then(() => {
        return next();
      })
      .catch((err: any) => {
        res.status(500);
        logger.error("polis_err_auth_error_432", err);
        next(err || "polis_err_auth_error_432");
      });
  };

  //   let xid = req.body.xid;
  //   let hasXid = !_.isUndefined(xid);

  //   if (hasXid) {
  //     req.p = req.p || {};
  //     req.p.xid = xid;
  //     getConversationIdFetchZid(req.body.conversation_id).then((zid) => {

  //       return getXidStuff(xid, zid).then((xidRecord) => {
  //         let foundXidRecord = xidRecord !== "noXidRecord";
  //         if (foundXidRecord) {
  //           assigner(req, "uid", Number(xidRecord.uid));
  //           return next();
  //         }
  //         // try other auth methods, and once those are done, use req.p.uid to create new xid record.
  //         doAuth(req, res).then(() => {
  //           if (req.p.uid && !isOptional) { // req.p.uid might be set now.
  //             return createXidRecordByZid(zid, req.p.uid, xid, req.body.x_profile_image_url, req.body.x_name, req.body.x_email);
  //           } else if (!isOptional) {
  //             throw "polis_err_missing_non_optional_uid";
  //           }
  //         }).then(() => {
  //           return next();
  //         }).catch((err) => {
  //           res.status(500);
  //           return next("polis_err_auth_xid_error_423423");
  //         });
  //       });
  //     });
  //   } else {
  //     doAuth(req, res).then(() => {
  //       return next();
  //     }).catch((err) => {
  //       res.status(500);
  //       next("polis_err_auth_error_432");
  //     });
  //   }
  // };
}
// input token from body or query, and populate req.body.u with userid.
function authOptional(assigner: any) {
  return _auth(assigner, true);
}

function auth(assigner: any) {
  return _auth(assigner, false);
}

function enableAgid(req: { body: Body }, res: any, next: () => void) {
  req.body.agid = 1;
  next();
}
/*
function meter(name) {
    return function (req, res, next){
        let start = Date.now();
        setTimeout(function() {
            metric(name + ".go", 1, start);
        }, 1);
        res.on('finish', function(){
          let end = Date.now();
          let duration = end - start;
          let status = ".ok";
          if (!res.statusCode || res.statusCode >= 500) {
            status = ".fail";
          } else if (res.statusCode >= 400) {
            status = ".4xx";
          }
          setTimeout(function() {
              metric(name + status, duration, end);
          }, 1);
        });
        next();
    };
}
*/
// 2xx
// 4xx
// 5xx
// logins
// failed logins
// forgot password

let whitelistedCrossDomainRoutes = [
  /^\/api\/v[0-9]+\/launchPrep/,
  /^\/api\/v[0-9]+\/setFirstCookie/,
];

let whitelistedDomains = [
  Config.getServerHostname(),
  ...Config.whitelistItems,
  "localhost:8080",
  "localhost:8040",
  "localhost:5000",
  "localhost:3000",
  "metropolis.vote",
  "facebook.com",
  "api.twitter.com",
  "", // for API
];

function hasWhitelistMatches(host: string) {
  let hostWithoutProtocol = host;
  if (host.startsWith("http://")) {
    hostWithoutProtocol = host.slice(7);
  } else if (host.startsWith("https://")) {
    hostWithoutProtocol = host.slice(8);
  }

  for (let i = 0; i < whitelistedDomains.length; i++) {
    let w = whitelistedDomains[i];
    if (hostWithoutProtocol.endsWith(w || "")) {
      // ok, the ending matches, now we need to make sure it's the same, or a subdomain.
      if (hostWithoutProtocol === w) {
        return true;
      }
      if (
        hostWithoutProtocol[
          hostWithoutProtocol.length - ((w || "").length + 1)
        ] === "."
      ) {
        // separated by a dot, so it's a subdomain.
        return true;
      }
    }
  }
  return false;
}
function addCorsHeader(
  req: {
    protocol: string;
    get: (arg0: string) => any;
    path: any;
    headers: Headers;
  },
  res: { header: (arg0: string, arg1: string | boolean) => void },
  next: (arg0?: string) => any
) {
  let host = "";
  if (domainOverride) {
    host = req.protocol + "://" + domainOverride;
  } else {
    // TODO does it make sense for this middleware to look
    // at origin || referer? is Origin for CORS preflight?
    // or for everything?
    // Origin was missing from FF, so added Referer.
    host = req.get("Origin") || req.get("Referer") || "";
  }

  // Somehow the fragment identifier is being sent by IE10????
  // Remove unexpected fragment identifier
  host = host.replace(/#.*$/, "");

  // Remove characters starting with the first slash following the double slash at the beginning.
  let result = /^[^\/]*\/\/[^\/]*/.exec(host);
  if (result && result[0]) {
    host = result[0];
  }
  // check if the route is on a special list that allows it to be called cross domain (by polisHost.js for example)
  let routeIsWhitelistedForAnyDomain = _.some(
    whitelistedCrossDomainRoutes,
    function (regex: { test: (arg0: any) => any }) {
      return regex.test(req.path);
    }
  );

  if (
    !domainOverride &&
    !hasWhitelistMatches(host) &&
    !routeIsWhitelistedForAnyDomain
  ) {
    logger.info("not whitelisted", { headers: req.headers, path: req.path });
    return next("unauthorized domain: " + host);
  }
  if (host === "") {
    // API
  } else {
    res.header("Access-Control-Allow-Origin", host);
    res.header(
      "Access-Control-Allow-Headers",
      "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With"
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET, PUT, POST, DELETE, OPTIONS"
    );
    res.header("Access-Control-Allow-Credentials", true);
  }
  return next();
}

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////
//
//             BEGIN ROUTES
//
////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

const hexToStr = Utils.hexToStr;

function handle_GET_launchPrep(
  req: {
    headers?: { origin: string };
    cookies: { [x: string]: any };
    p: { dest: any };
  },
  res: { redirect: (arg0: any) => void }
) {
  if (!req.cookies[COOKIES.PERMANENT_COOKIE]) {
    setPermanentCookie(req, res, makeSessionToken());
  }
  setCookieTestCookie(req, res);

  // Argument of type '{ redirect: (arg0: any) => void; }' is not assignable to parameter of type '{ cookie: (arg0: any, arg1: any, arg2: any) => void; }'.
  // Property 'cookie' is missing in type '{ redirect: (arg0: any) => void; }' but required in type '{ cookie: (arg0: any, arg1: any, arg2: any) => void; }'.ts(2345)
  // @ts-ignore
  setCookie(req, res, "top", "ok", {
    httpOnly: false, // not httpOnly - needed by JS
  });

  // using hex since it doesn't require escaping like base64.
  let dest = hexToStr(req.p.dest);
  res.redirect(dest);
}

function handle_GET_tryCookie(
  req: { headers?: { origin: string }; cookies: { [x: string]: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: {}): void; new (): any };
    };
  }
) {
  if (!req.cookies[COOKIES.TRY_COOKIE]) {
    // Argument of type '{ status: (arg0: number) => { (): any; new (): any; json:
    // { (arg0: {}): void; new (): any; }; }; }' is not assignable to parameter of type
    // '{ cookie: (arg0: any, arg1: any, arg2: any) => void; }'.
    //   Property 'cookie' is missing in type '{ status: (arg0: number) =>
    // { (): any; new (): any; json: { (arg0: {}): void; new (): any; }; };
    // } ' but required in type '{ cookie: (arg0: any, arg1: any, arg2: any) => void; } '.ts(2345)
    // @ts-ignore
    setCookie(req, res, COOKIES.TRY_COOKIE, "ok", {
      httpOnly: false, // not httpOnly - needed by JS
    });
  }
  res.status(200).json({});
}
let pcaCacheSize = Config.cacheMathResults ? 300 : 1;
let pcaCache = new LruCache({
  max: pcaCacheSize,
});

let lastPrefetchedMathTick = -1;

// this scheme might not last forever. For now, there are only a couple of MB worth of conversation pca data.
function fetchAndCacheLatestPcaData() {
  let lastPrefetchPollStartTime = Date.now();

  function waitTime() {
    let timePassed = Date.now() - lastPrefetchPollStartTime;
    return Math.max(0, 2500 - timePassed);
  }
  // cursor.sort([["math_tick", "asc"]]);
  pgQueryP_readOnly(
    "select * from math_main where caching_tick > ($1) order by caching_tick limit 10;",
    [lastPrefetchedMathTick]
  ).then((rows: any[]) => {
      if (!rows || !rows.length) {
        // call again
        logger.info("mathpoll done");
        setTimeout(fetchAndCacheLatestPcaData, waitTime());
        return;
      }

      let results = rows.map(
        (row: { data: any; math_tick: any; caching_tick: any }) => {
          let item = row.data;

          if (row.math_tick) {
            item.math_tick = Number(row.math_tick);
          }
          if (row.caching_tick) {
            item.caching_tick = Number(row.caching_tick);
          }

          logger.info("mathpoll updating", {
            caching_tick: item.caching_tick,
            zid: item.zid,
          });

          // let prev = pcaCache.get(item.zid);
          if (item.caching_tick > lastPrefetchedMathTick) {
            lastPrefetchedMathTick = item.caching_tick;
          }

          processMathObject(item);

          return updatePcaCache(item.zid, item);
        }
      );
      Promise.all(results).then(() => {
        setTimeout(fetchAndCacheLatestPcaData, waitTime());
      });
    })
    .catch((err: any) => {
      logger.error("mathpoll error", err);
      setTimeout(fetchAndCacheLatestPcaData, waitTime());
    });
}

// don't start immediately, let other things load first.
// setTimeout(fetchAndCacheLatestPcaData, 5000);
fetchAndCacheLatestPcaData; // TODO_DELETE

/*
function splitTopLevelGroup(o, gid) {
  function shouldKeepGroup(g) {
    return g.id !== gid;
  }
  function uniquifySubgroupId(g) {
    g.id = g.id + 100;
    return g;
  }
  function withGid(g) {
    return g.id === gid;
  }

  let newGroupClusters = o['group-clusters'].filter(shouldKeepGroup);
  let subgroupClusterTop = _.find(o['subgroup-clusters'], withGid);
  if (!subgroupClusterTop || !subgroupClusterTop.val) {
    return o;
  }
  let subGroupClustersToAdd = subgroupClusterTop.val.map(uniquifySubgroupId);
  newGroupClusters = newGroupClusters.concat(subGroupClustersToAdd);

  let newRepness = o['repness'].filter(shouldKeepGroup);
  let subgroupRepnessTop = _.find(o['subgroup-repness'], withGid);
  if (!subgroupRepnessTop || !subgroupRepnessTop.val) {
    return o;
  }
  let repnessToAdd = subgroupRepnessTop.val.map(uniquifySubgroupId);
  newRepness = newRepness.concat(repnessToAdd);

  let newGroupVotes = o['group-votes'].filter(shouldKeepGroup);
  let subgroupVotesTop = _.find(o['subgroup-votes'], withGid);
  if (!subgroupVotesTop || !subgroupVotesTop.val) {
    return o;
  }
  let subGroupVotesToAdd = subgroupVotesTop.val.map(uniquifySubgroupId);
  newGroupVotes = newGroupVotes.concat(subGroupVotesToAdd);

  o['repness'] = _.sortBy(newRepness, "id");
  o['group-clusters'] = _.sortBy(newGroupClusters, "id");
  o['group-votes'] = _.sortBy(newGroupVotes, "id");
  return o;
}

function packGids(o) {

  // TODO start index at 1

  function remapGid(g) {
    g.id = gid2newGid[g.id];
    return g;
  }
  let origGids = _.map(o['group-clusters'], (g) => {return g.id;});
  origGids.sort();
  let gid2newGid = {};
  for (let i = 0; i < origGids.length; i++) {
    gid2newGid[origGids[i]] = i;
  }
  o['group-clusters'] = _.sortBy(_.map(o['group-clusters'], remapGid), 'id');
  o['group-votes'] = _.sortBy(_.map(o['group-votes'], remapGid), 'id');
  o['repness'] = _.sortBy(_.map(o['repness'], remapGid), 'id');

  o['subgroup-clusters'] = _.sortBy(_.map(o['subgroup-clusters'], remapGid), 'id');
  o['subgroup-votes'] = _.sortBy(_.map(o['subgroup-votes'], remapGid), 'id');
  o['subgroup-repness'] = _.sortBy(_.map(o['subgroup-repness'], remapGid), 'id');
  return o;
}
*/

function processMathObject(o: { [x: string]: any }) {
  function remapSubgroupStuff(g: { val: any[] }) {
    if (_.isArray(g.val)) {
      g.val = g.val.map((x: { id: number }) => {
        return { id: Number(x.id), val: x };
      });
    } else {
      // Argument of type '(id: number) => { id: number; val: any; }'
      // is not assignable to parameter of type '(value: string, index: number, array: string[]) => { id: number; val: any; }'.
      // Types of parameters 'id' and 'value' are incompatible.
      //         Type 'string' is not assignable to type 'number'.ts(2345)
      // @ts-ignore
      g.val = _.keys(g.val).map((id: number) => {
        return { id: Number(id), val: g.val[id] };
      });
    }
    return g;
  }

  // Normalize so everything is arrays of objects (group-clusters is already in this format, but needs to have the val: subobject style too).

  if (_.isArray(o["group-clusters"])) {
    // NOTE this is different since group-clusters is already an array.
    o["group-clusters"] = o["group-clusters"].map((g: { id: any }) => {
      return { id: Number(g.id), val: g };
    });
  }

  if (!_.isArray(o["repness"])) {
    o["repness"] = _.keys(o["repness"]).map((gid: string | number) => {
      return { id: Number(gid), val: o["repness"][gid] };
    });
  }
  if (!_.isArray(o["group-votes"])) {
    o["group-votes"] = _.keys(o["group-votes"]).map(
      (gid: string | number) => {
        return { id: Number(gid), val: o["group-votes"][gid] };
      }
    );
  }
  if (!_.isArray(o["subgroup-repness"])) {
    o["subgroup-repness"] = _.keys(o["subgroup-repness"]).map(
      (gid: string | number) => {
        return { id: Number(gid), val: o["subgroup-repness"][gid] };
      }
    );
    o["subgroup-repness"].map(remapSubgroupStuff);
  }
  if (!_.isArray(o["subgroup-votes"])) {
    o["subgroup-votes"] = _.keys(o["subgroup-votes"]).map(
      (gid: string | number) => {
        return { id: Number(gid), val: o["subgroup-votes"][gid] };
      }
    );
    o["subgroup-votes"].map(remapSubgroupStuff);
  }
  if (!_.isArray(o["subgroup-clusters"])) {
    o["subgroup-clusters"] = _.keys(o["subgroup-clusters"]).map(
      (gid: string | number) => {
        return { id: Number(gid), val: o["subgroup-clusters"][gid] };
      }
    );
    o["subgroup-clusters"].map(remapSubgroupStuff);
  }

  // Edge case where there are two groups and one is huge, split the large group.
  // Once we have a better story for h-clust in the participation view, then we can just show the h-clust instead.
  // var groupVotes = o['group-votes'];
  // if (_.keys(groupVotes).length === 2 && o['subgroup-votes'] && o['subgroup-clusters'] && o['subgroup-repness']) {
  //   var s0 = groupVotes[0].val['n-members'];
  //   var s1 = groupVotes[1].val['n-members'];
  //   const scaleRatio = 1.1;
  //   if (s1 * scaleRatio < s0) {
  //     o = splitTopLevelGroup(o, groupVotes[0].id);
  //   } else if (s0 * scaleRatio < s1) {
  //     o = splitTopLevelGroup(o, groupVotes[1].id);
  //   }
  // }

  // // Gaps in the gids are not what we want to show users, and they make client development difficult.
  // // So this guarantees that the gids are contiguous. TODO look into Darwin.
  // o = packGids(o);

  // Un-normalize to maintain API consistency.
  // This could removed in a future API version.
  function toObj(a: string | any[]) {
    let obj = {};
    if (!a) {
      return obj;
    }
    for (let i = 0; i < a.length; i++) {
      // Element implicitly has an 'any' type
      // because expression of type 'any' can't be used to index type '{ } '.ts(7053)
      // @ts-ignore
      obj[a[i].id] = a[i].val;
      // Element implicitly has an 'any' type
      // because expression of type 'any' can't be used to index type '{ } '.ts(7053)
      // @ts-ignore
      obj[a[i].id].id = a[i].id;
    }
    return obj;
  }
  function toArray(a: any[]) {
    if (!a) {
      return [];
    }
    return a.map((g: { id: any; val: any }) => {
      let id = g.id;
      g = g.val;
      g.id = id;
      return g;
    });
  }
  o["repness"] = toObj(o["repness"]);
  o["group-votes"] = toObj(o["group-votes"]);
  o["group-clusters"] = toArray(o["group-clusters"]);

  delete o["subgroup-repness"];
  delete o["subgroup-votes"];
  delete o["subgroup-clusters"];
  return o;
}

function getPca(zid?: any, math_tick?: number) {
  let cached = pcaCache.get(zid);
  // Object is of type 'unknown'.ts(2571)
  // @ts-ignore
  if (cached && cached.expiration < Date.now()) {
    cached = null;
  }
  // Object is of type 'unknown'.ts(2571)
  // @ts-ignore
  let cachedPOJO = cached && cached.asPOJO;
  if (cachedPOJO) {
    if (cachedPOJO.math_tick <= (math_tick || 0)) {
      logger.info("math was cached but not new", {
        zid,
        cached_math_tick: cachedPOJO.math_tick,
        query_math_tick: math_tick,
      });
      return Promise.resolve(null);
    } else {
      logger.info("math from cache", { zid, math_tick });
      return Promise.resolve(cached);
    }
  }

  logger.info("mathpoll cache miss", { zid, math_tick });

  // NOTE: not caching results from this query for now, think about this later.
  // not caching these means that conversations without new votes might not be cached. (closed conversations may be slower to load)
  // It's probably not difficult to cache, but keeping things simple for now, and only caching things that come down with the poll.

  let queryStart = Date.now();

  return pgQueryP_readOnly(
    "select * from math_main where zid = ($1) and math_env = ($2);",
    [zid, Config.mathEnv]
  ).then((rows: string | any[]) => {
    let queryEnd = Date.now();
    let queryDuration = queryEnd - queryStart;
    addInRamMetric("pcaGetQuery", queryDuration);

    if (!rows || !rows.length) {
      logger.info(
        "mathpoll related; after cache miss, unable to find data for",
        {
          zid,
          math_tick,
          math_env: Config.mathEnv,
        }
      );
      return null;
    }
    let item = rows[0].data;

    if (rows[0].math_tick) {
      item.math_tick = Number(rows[0].math_tick);
    }

    if (item.math_tick <= (math_tick || 0)) {
      logger.info("after cache miss, unable to find newer item", {
        zid,
        math_tick,
      });
      return null;
    }
    logger.info("after cache miss, found item, adding to cache", {
      zid,
      math_tick,
    });

    processMathObject(item);

    return updatePcaCache(zid, item).then(
      function (o: any) {
        return o;
      },
      function (err: any) {
        return err;
      }
    );
  });
}

function updatePcaCache(zid: any, item: { zid: any }) {
  return new Promise(function (
    resolve: (arg0: {
      asPOJO: any;
      asJSON: string;
      asBufferOfGzippedJson: any;
      expiration: number;
    }) => void,
    reject: (arg0: any) => any
  ) {
    delete item.zid; // don't leak zid
    let asJSON = JSON.stringify(item);
    let buf = Buffer.from(asJSON, "utf-8");
    zlib.gzip(buf, function (err: any, jsondGzipdPcaBuffer: any) {
      if (err) {
        return reject(err);
      }

      let o = {
        asPOJO: item,
        asJSON: asJSON,
        asBufferOfGzippedJson: jsondGzipdPcaBuffer,
        expiration: Date.now() + 3000,
      };
      // save in LRU cache, but don't update the lastPrefetchedMathTick
      pcaCache.set(zid, o);
      resolve(o);
    });
  });
}
function redirectIfHasZidButNoConversationId(
  req: { body: { zid: any; conversation_id: any }; headers?: any },
  res: {
    writeHead: (arg0: number, arg1: { Location: string }) => void;
    end: () => any;
  },
  next: () => any
) {
  if (req.body.zid && !req.body.conversation_id) {
    logger.info("redirecting old zid user to about page");

    const path = "/about";
    const protocol = req.headers["x-forwarded-proto"] || "http";

    res.writeHead(302, {
      Location: protocol + "://" + req?.headers?.host + path,
    });
    return res.end();
  }
  return next();
}

function handle_GET_math_pca(
  req: Request,
  res: Response
) {
  // migrated off this path, old clients were causing timeout issues by polling repeatedly without waiting for a result for a previous poll.
  res.status(304).end();
}

// Cache the knowledge of whether there are any pca results for a given zid.
// Needed to determine whether to return a 404 or a 304.
// zid -> boolean
let pcaResultsExistForZid = {};
function handle_GET_math_pca2(
  req: { p: { zid: any; math_tick: any; ifNoneMatch: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      end: { (): void; new (): any };
    };
    set: (arg0: {
      "Content-Type": string;
      "Content-Encoding": string;
      Etag: string;
    }) => void;
    send: (arg0: any) => void;
  }
) {
  let zid = req.p.zid;
  let math_tick = req.p.math_tick;

  let ifNoneMatch = req.p.ifNoneMatch;
  if (ifNoneMatch) {
    if (!_.isUndefined(math_tick)) {
      return fail(
        res,
        400,
        "Expected either math_tick param or If-Not-Match header, but not both."
      );
    }
    if (ifNoneMatch.includes("*")) {
      math_tick = 0;
    } else {
      let entries = ifNoneMatch.split(/ *, */).map((x: string) => {
        return Number(
          x
            .replace(/^[wW]\//, "")
            .replace(/^"/, "")
            .replace(/"$/, "")
        );
      });
      math_tick = _.min(entries); // supporting multiple values for the ifNoneMatch header doesn't really make sense, so I've arbitrarily chosen _.min to decide on one.
    }
  } else if (_.isUndefined(math_tick)) {
    math_tick = -1;
  }
  function finishWith304or404() {
    // Element implicitly has an 'any' type
    // because expression of type 'any' can't be used to index type '{ } '.ts(7053)
    // @ts-ignore
    if (pcaResultsExistForZid[zid]) {
      res.status(304).end();
    } else {
      // Technically, this should probably be a 404, but
      // the red errors make it hard to see other errors
      // in Chrome Developer Tools.
      res.status(304).end();
      // res.status(404).end();
    }
  }

  getPca(zid, math_tick)
    .then(function (data: {
      asPOJO: { math_tick: string };
      asBufferOfGzippedJson: any;
    }) {
      if (data) {
        // The buffer is gzipped beforehand to cut down on server effort in re-gzipping the same json string for each response.
        // We can't cache this endpoint on Cloudflare because the response changes too freqently, so it seems like the best way
        // is to cache the gzipped json'd buffer here on the server.
        res.set({
          "Content-Type": "application/json",
          "Content-Encoding": "gzip",
          Etag: '"' + data.asPOJO.math_tick + '"',
        });
        res.send(data.asBufferOfGzippedJson);
      } else {
        // check whether we should return a 304 or a 404
        // Element implicitly has an 'any' type
        // because expression of type 'any' can't be used to index type '{ } '.ts(7053)
        // @ts-ignore
        if (_.isUndefined(pcaResultsExistForZid[zid])) {
          // This server doesn't know yet if there are any PCA results in the DB
          // So try querying from -1
          return getPca(zid, -1).then(function (data: any) {
            let exists = !!data;
            // Element implicitly has an 'any' type
            // because expression of type 'any' can't be used to index type '{ } '.ts(7053)
            // @ts-ignore
            pcaResultsExistForZid[zid] = exists;
            finishWith304or404();
          });
        } else {
          finishWith304or404();
        }
      }
    })
    .catch(function (err: any) {
      fail(res, 500, err);
    });
}

function getZidForRid(rid: any) {
  return pgQueryP("select zid from reports where rid = ($1);", [rid]).then(
    (row: string | any[]) => {
      if (!row || !row.length) {
        return null;
      }
      return row[0].zid;
    }
  );
}

function handle_GET_math_correlationMatrix(
  req: { p: { rid: any; math_tick: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: { status: string }): void; new (): any };
    };
    json: (arg0: any) => void;
  }
) {
  let rid = req.p.rid;
  let math_env = Config.mathEnv;
  let math_tick = req.p.math_tick;

  function finishAsPending() {
    res.status(202).json({
      status: "pending",
    });
  }

  function hasCommentSelections() {
    return pgQueryP(
      "select * from report_comment_selections where rid = ($1) and selection = 1;",
      [rid]
    ).then((rows: string | any[]) => {
      return rows.length > 0;
    });
  }

  let requestExistsPromise = pgQueryP(
    "select * from worker_tasks where task_type = 'generate_report_data' and math_env=($2) " +
      "and task_bucket = ($1) " +
      // "and attempts < 3 " +
      "and (task_data->>'math_tick')::int >= ($3) " +
      "and finished_time is NULL;",
    [rid, math_env, math_tick]
  );

  let resultExistsPromise = pgQueryP(
    "select * from math_report_correlationmatrix where rid = ($1) and math_env = ($2) and math_tick >= ($3);",
    [rid, math_env, math_tick]
  );

  Promise.all([resultExistsPromise, getZidForRid(rid)])
    .then((a: any[]) => {
      let rows = a[0];
      let zid = a[1];
      if (!rows || !rows.length) {
        return requestExistsPromise.then((requests_rows: string | any[]) => {
          const shouldAddTask = !requests_rows || !requests_rows.length;
          // const shouldAddTask = true;

          if (shouldAddTask) {
            return hasCommentSelections().then((hasSelections: any) => {
              if (!hasSelections) {
                return res.status(202).json({
                  status: "polis_report_needs_comment_selection",
                });
              }
              return pgQueryP(
                "insert into worker_tasks (task_type, task_data, task_bucket, math_env) values ('generate_report_data', $1, $2, $3);",
                [
                  JSON.stringify({
                    rid: rid,
                    zid: zid,
                    math_tick: math_tick,
                  }),
                  rid,
                  math_env,
                ]
              ).then(finishAsPending);
            });
          }
          finishAsPending();
        });
      }
      res.json(rows[0].data);
    })
    .catch((err: any) => {
      return fail(res, 500, "polis_err_GET_math_correlationMatrix", err);
    });
}

function doAddDataExportTask(
  math_env: string | undefined,
  email: string,
  zid: number,
  atDate: number,
  format: string,
  task_bucket: number
) {
  return pgQueryP(
    "insert into worker_tasks (math_env, task_data, task_type, task_bucket) values ($1, $2, 'generate_export_data', $3);",
    [
      math_env,
      {
        email: email,
        zid: zid,
        "at-date": atDate,
        format: format,
      },
      task_bucket, // TODO hash the params to get a consistent number?
    ]
  );
}
if (
  Config.runPeriodicExportTests &&
  !devMode &&
  Config.mathEnv === "preprod"
) {
  let runExportTest = () => {
    let math_env = "prod";
    let email = Config.adminEmailDataExportTest;
    let zid = 12480;
    let atDate = Date.now();
    let format = "csv";
    let task_bucket = Math.abs((Math.random() * 999999999999) >> 0);
    doAddDataExportTask(
      math_env,
      email,
      zid,
      atDate,
      format,
      task_bucket
    ).then(() => {
      setTimeout(() => {
        pgQueryP(
          "select * from worker_tasks where task_type = 'generate_export_data' and task_bucket = ($1);",
          [task_bucket]
        ).then((rows: string | any[]) => {
          let ok = rows && rows.length;
          let newOk;
          if (ok) {
            newOk = rows[0].finished_time > 0;
          }
          if (ok && newOk) {
            logger.info("runExportTest success");
          } else {
            logger.error("runExportTest failed");
            emailBadProblemTime("Math export didn't finish.");
          }
        });
      }, 10 * 60 * 1000); // wait 10 minutes before verifying
    });
  };
  setInterval(runExportTest, 6 * 60 * 60 * 1000); // every 6 hours
}
function handle_GET_dataExport(
  req: { params: { export?: string; format?: string }; p: { zid: any } },
  res: any
) {
  // standard data export handler
  const dataExportHandler = (err: any, result: { rows: any }) => {
    if (err) {
      return fail(res, 500, "polis_err_data_export123");
    }

    if (result.rows.length === 0) {
      return fail(res, 404, "No data");
    }

    if (req.params.export?.endsWith("csv")) {
      const csv = parse(result.rows);
      res.header("Content-Type", "text/csv");
      res.attachment(req.params.export);
      res.send(csv);
    } else {
      res.status(200).json({
        data: result.rows,
      });
    }
  };

  // participants-votes.csv
  if (
    req.params.export === "participants" ||
    req.params.export === "participants.csv"
  ) {
    return pgQuery_readOnly(
      `select
        participants.pid as participant,
        (select count(comments.tid) from comments where comments.pid = participants.pid and comments.zid = ($1)) as n_comments,
        (select count(votes.created) from votes where votes.pid = participants.pid and votes.zid = ($1)) as n_votes,
        (select count(votes.created) from votes where votes.pid = participants.pid and votes.vote = 1 and votes.zid = ($1)) as n_agree,
        (select count(votes.created) from votes where votes.pid = participants.pid and votes.vote = -1 and votes.zid = ($1)) as n_disagree,
        (select count(votes.created) from votes where votes.pid = participants.pid and votes.vote = 0 and votes.zid = ($1)) as n_skip,
        (select count(votes.created) from votes where votes.pid = participants.pid and votes.vote = 1 and votes.high_priority = true and votes.zid = ($1)) as n_agree_impt,
        (select count(votes.created) from votes where votes.pid = participants.pid and votes.vote = -1 and votes.high_priority = true and votes.zid = ($1)) as n_disagree_impt
      from participants
      where participants.zid = ($1)
      order by participants.pid`,
      [req.p.zid],
      dataExportHandler
    );
  }

  // comments.csv
  if (
    req.params.export === "comments" ||
    req.params.export === "comments.csv"
  ) {
    return pgQuery_readOnly(
      `select
          comments.created as timestamp, comments.created as datetime,
          comments.tid as comment_id,
          comments.uid as author_id,
          (select count(votes.tid) from votes where votes.tid = comments.tid and votes.vote = 1) as agree_votes,
          (select count(votes.tid) from votes where votes.tid = comments.tid and votes.vote = -1) as disagree_votes,
          (select count(votes.tid) from votes where votes.tid = comments.tid and votes.vote = 1 and votes.high_priority = true) as agree_impt,
          (select count(votes.tid) from votes where votes.tid = comments.tid and votes.vote = -1 and votes.high_priority = true) as disagree_impt,
          comments.mod as moderated,
          comments.txt as comment_body
        from comments
        where comments.zid = ($1)`,
      [req.p.zid],
      dataExportHandler
    );
  }

  // votes.csv
  if (req.params.export === "votes" || req.params.export === "votes.csv") {
    return pgQuery_readOnly(
      `select created as timestamp, created as datetime, tid as comment_id, pid as voter_id, vote, high_priority
      from votes where zid = ($1)`,
      [req.p.zid],
      dataExportHandler
    );
  }

  res.writeHead(404);
  res.json({
    status: 404,
  });
  return;
}
function getBidIndexToPidMapping(zid: number, math_tick: number) {
  math_tick = math_tick || -1;
  return pgQueryP_readOnly(
    "select * from math_bidtopid where zid = ($1) and math_env = ($2);",
    [zid, Config.mathEnv]
  ).then((rows: string | any[]) => {
    if (!rows || !rows.length) {
      // Could actually be a 404, would require more work to determine that.
      return new Error("polis_err_get_pca_results_missing");
    } else if (rows[0].data.math_tick <= math_tick) {
      return new Error("polis_err_get_pca_results_not_new");
    } else {
      return rows[0].data;
    }
  });
}
function handle_GET_bidToPid(
  req: { p: { zid: any; math_tick: any } },
  res: {
    json: (arg0: { bidToPid: any }) => void;
    status: (arg0: number) => {
      (): any;
      new (): any;
      end: { (): void; new (): any };
    };
  }
) {
  let zid = req.p.zid;
  let math_tick = req.p.math_tick;
  getBidIndexToPidMapping(zid, math_tick).then(
    function (doc: { bidToPid: any }) {
      let b2p = doc.bidToPid;
      res.json({
        bidToPid: b2p,
      });
    },
    function () {
      res.status(304).end();
    }
  );
}

function getXids(zid: any) {
  return meteredPromise("getXids", new Promise(function (
    resolve: (arg0: any) => void,
    reject: (arg0: string) => void
  ) {
    pgQuery_readOnly(
      "select pid, xid from xids inner join " +
        "(select * from participants where zid = ($1)) as p on xids.uid = p.uid " +
        " where owner in (select org_id from conversations where zid = ($1));",
      [zid],
      function (err: any, result: { rows: any }) {
        if (err) {
          reject("polis_err_fetching_xids");
          return;
        }
        resolve(result.rows);
      }
    );
  }));
}
function handle_GET_xids(
  req: { p: { uid?: any; zid: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: any): void; new (): any };
    };
  }
) {
  let uid = req.p.uid;
  let zid = req.p.zid;

  isOwner(zid, uid).then(
    function (owner: any) {
      if (owner) {
        getXids(zid).then(
          function (xids: any) {
            res.status(200).json(xids);
          },
          function (err: any) {
            fail(res, 500, "polis_err_get_xids", err);
          }
        );
      } else {
        fail(res, 403, "polis_err_get_xids_not_authorized");
      }
    },
    function (err: any) {
      fail(res, 500, "polis_err_get_xids", err);
    }
  );
}
function handle_POST_xidWhitelist(
  req: { p: { xid_whitelist: any; uid?: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: {}): void; new (): any };
    };
  }
) {
  const xid_whitelist = req.p.xid_whitelist;
  const len = xid_whitelist.length;
  const owner = req.p.uid;
  const entries = [];
  try {
    for (var i = 0; i < len; i++) {
      entries.push("(" + escapeLiteral(xid_whitelist[i]) + "," + owner + ")");
    }
  } catch (err) {
    return fail(res, 400, "polis_err_bad_xid", err);
  }

  pgQueryP(
    "insert into xid_whitelist (xid, owner) values " +
      entries.join(",") +
      " on conflict do nothing;",
    []
  )
    .then(() => {
      res.status(200).json({});
    })
    .catch((err: any) => {
      return fail(res, 500, "polis_err_POST_xidWhitelist", err);
    });
}

function handle_GET_bid(
  req: { p: { uid?: any; zid: any; math_tick: any } },
  res: {
    json: (arg0: { bid: any }) => void;
    status: (arg0: number) => {
      (): any;
      new (): any;
      end: { (): void; new (): any };
    };
  }
) {
  let uid = req.p.uid;
  let zid = req.p.zid;
  let math_tick = req.p.math_tick;

  let dataPromise = getBidIndexToPidMapping(zid, math_tick);
  let pidPromise = getPidPromise(zid, uid);
  let mathResultsPromise = getPca(zid, math_tick);

  Promise.all([dataPromise, pidPromise, mathResultsPromise])
    .then(
      function (items: { asPOJO: any }[]) {
        // Property 'bidToPid' does not exist on type '{ asPOJO: any; }'.ts(2339)
        // @ts-ignore
        let b2p = items[0].bidToPid || []; // not sure yet if "|| []" is right here.
        let pid = items[1];
        let mathResults = items[2].asPOJO;
        if ((pid as unknown as number) < 0) {
          // NOTE: this API should not be called in /demo mode
          fail(res, 500, "polis_err_get_bid_bad_pid");
          return;
        }

        let indexToBid = mathResults["base-clusters"].id;

        let yourBidi = -1;
        for (var bidi = 0; bidi < b2p.length; bidi++) {
          let pids = b2p[bidi];
          if (pids.indexOf(pid) !== -1) {
            yourBidi = bidi;
            break;
          }
        }

        let yourBid = indexToBid[yourBidi];

        if (yourBidi >= 0 && _.isUndefined(yourBid)) {
          logger.error("polis_err_math_index_mapping_mismatch", { pid, b2p });
          yourBid = -1;
        }

        res.json({
          bid: yourBid, // The user's current bid
        });
      },
      function () {
        res.status(304).end();
      }
    )
    .catch(function (err: any) {
      fail(res, 500, "polis_err_get_bid_misc", err);
    });
}

function handle_POST_auth_password(
  req: { p: { pwresettoken: any; newPassword: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: string): void; new (): any };
    };
  }
) {
  let pwresettoken = req.p.pwresettoken;
  let newPassword = req.p.newPassword;

  getUidForPwResetToken(pwresettoken).then((userParams: {uid: any}) => {
    let uid = Number(userParams.uid);
    generateHashedPassword(
      newPassword,
      function (err: any, hashedPassword: any) {
        return pgQueryP(
          "insert into jianiuevyew (uid, pwhash) values " +
            "($1, $2) on conflict (uid) " +
            "do update set pwhash = excluded.pwhash;",
          [uid, hashedPassword]
        ).then(
          () => {
            res.status(200).json("Password reset successful.");
            clearPwResetToken(pwresettoken, function (err: any) {
              if (err) {
                logger.error("polis_err_auth_pwresettoken_clear_fail", err);
              }
            });
          },
          (err: any) => {
            fail(res, 500, "Couldn't reset password.", err);
          }
        );
      }
    );
  }).catch((err) => {
    fail(
      res,
      500,
      "Password Reset failed. Couldn't find matching pwresettoken.",
      err
    );
  });
}

const getServerNameWithProtocol = Config.getServerNameWithProtocol;

async function handle_POST_auth_pwresettoken(
  req: { p: { email: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: string): void; new (): any };
    };
  }
) {
  let email = req.p.email;

  let server = getServerNameWithProtocol(req);

  // let's clear the cookies here, in case something is borked.
  clearCookies(req, res);

  function finish() {
    res
      .status(200)
      .json("Password reset email sent, please check your email.");
  }

  let uid;
  try {
    uid = await getUidByEmail(email)
  } catch (err) {
    sendPasswordResetEmailFailure(email, server);
    finish();
    return;
  }

  const pwresettoken = await setupPwReset(uid)
  try {
    // TODO: make this async
    await sendPasswordResetEmail(
      uid,
      pwresettoken,
      server
    );
  } catch (err) {
    fail(
      res,
      500,
      "Error: Couldn't send password reset email.",
      err
    );
    return;
  }

  finish();
}

function sendPasswordResetEmailFailure(email: any, server: any) {
  let body = `We were unable to find a pol.is account registered with the email address: ${email}

You may have used another email address to create your account.

If you need to create a new account, you can do that here ${server}/

Feel free to reply to this email if you need help.`;

  return sendTextEmail(
    polisFromAddress,
    email,
    "Password Reset Failed",
    body
  );
}

function getUidByEmail(email: string) {
  email = email.toLowerCase();
  return pgQueryP_readOnly(
    "SELECT uid FROM users where LOWER(email) = ($1);",
    [email]
  ).then(function (rows: string | any[]) {
    if (!rows || !rows.length) {
      throw new Error("polis_err_no_user_matching_email");
    }
    return rows[0].uid;
  });
}

function clearCookie(
  req: { [key: string]: any; headers?: { origin: string } },
  res: {
    [key: string]: any;
    clearCookie?: (
      arg0: any,
      arg1: { path: string; domain?: string }
    ) => void;
  },
  cookieName: any
) {
  res?.clearCookie?.(cookieName, {
    path: "/",
    domain: cookies.cookieDomain(req),
  });
}

function clearCookies(
  req: { headers?: Headers; cookies?: any; p?: any },
  res: {
    clearCookie?: (
      arg0: string,
      arg1: { path: string; domain?: string }
    ) => void;
    status?: (arg0: number) => void;
    _headers?: { [x: string]: any };
    redirect?: (arg0: string) => void;
    set?: (arg0: { "Content-Type": string }) => void;
  }
) {
  let cookieName;
  for (cookieName in req.cookies) {
    // Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{ e: boolean; token2: boolean; uid2: boolean; uc: boolean; plan: boolean; referrer: boolean; parent_url: boolean; }'.
    // No index signature with a parameter of type 'string' was found on type '{ e: boolean; token2: boolean; uid2: boolean; uc: boolean; plan: boolean; referrer: boolean; parent_url: boolean; }'.ts(7053)
    // @ts-ignore
    if (COOKIES_TO_CLEAR[cookieName]) {
      res?.clearCookie?.(cookieName, {
        path: "/",
        domain: cookies.cookieDomain(req),
      });
    }
  }
  logger.info(
    "after clear res set-cookie: " +
      JSON.stringify(res?._headers?.["set-cookie"])
  );
}
function doCookieAuth(
  assigner: (arg0: any, arg1: string, arg2: number) => void,
  isOptional: any,
  req: { cookies: { [x: string]: any }; body: { uid?: any } },
  res: { status: (arg0: number) => void },
  next: { (err: any): void; (arg0?: string): void }
) {
  let token = req.cookies[COOKIES.TOKEN];

  //if (req.body.uid) { next(401); return; } // shouldn't be in the post - TODO - see if we can do the auth in parallel for non-destructive operations
  getUserInfoForSessionToken(token).then(uid => {
    if (req.body.uid && req.body.uid !== uid) {
      res.status(401);
      next("polis_err_auth_mismatch_uid");
      return;
    }
    assigner(req, "uid", Number(uid));
    next();
  }).catch(() => {
    clearCookies(req, res); // TODO_MULTI_DATACENTER_CONSIDERATION
    if (isOptional) {
      next();
    } else {
      res.status(403);
      next("polis_err_auth_no_such_token");
    }
    return;
  });
}
async function handle_POST_auth_deregister(
  req: { p: { showPage?: any }; cookies: { [x: string]: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      end: { (): void; new (): any };
      send: { (arg0: string): void; new (): any };
    };
    set: (arg0: { "Content-Type": string }) => void;
  }
) {
  req.p = req.p || {};
  let token = req.cookies[COOKIES.TOKEN];

  // clear cookies regardless of auth status
  clearCookies(req, res);

  function finish() {
    if (!req.p.showPage) {
      res.status(200).end();
    }
  }
  if (!token) {
    // nothing to do
    return finish();
  }

  try {
    await endSession(token);
    finish();
  }
  catch (err) {
    fail(res, 500, "couldn't end session", err);
    return;
  }
}

function hashStringToInt32(s: string) {
  let h = 1;
  if (typeof s !== "string" || !s.length) {
    return 99;
  }
  for (var i = 0; i < s.length; i++) {
    h = h * s.charCodeAt(i) * 31;
  }
  if (h < 0) {
    h = -h;
  }
  // fit in 32 bit signed
  while (h > 2147483648) {
    h = h / 2;
  }
  return h;
}

function handle_POST_metrics(
  req: {
    cookies: { [x: string]: any };
    p: {
      uid: null;
      durs: any[];
      clientTimestamp: any;
      times: any[];
      types: any[];
    };
  },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: {}): any; new (): any };
    };
    json: (arg0: {}) => void;
  }
) {
  var enabled = false;
  if (!enabled) {
    return res.status(200).json({});
  }

  const pc = req.cookies[COOKIES.PERMANENT_COOKIE];
  const hashedPc = hashStringToInt32(pc);

  const uid = req.p.uid || null;
  const durs = req.p.durs.map(function (dur: number | null) {
    if (dur === -1) {
      dur = null;
    }
    return dur;
  });
  const clientTimestamp = req.p.clientTimestamp;
  const ages = req.p.times.map(function (t: number) {
    return clientTimestamp - t;
  });
  const now = Date.now();
  const timesInTermsOfServerTime = ages.map(function (a: number) {
    return now - a;
  });
  const len = timesInTermsOfServerTime.length;
  const entries = [];
  for (var i = 0; i < len; i++) {
    entries.push(
      "(" +
        [
          uid || "null",
          req.p.types[i],
          durs[i],
          hashedPc,
          timesInTermsOfServerTime[i],
        ].join(",") +
        ")"
    );
  }

  pgQueryP(
    "insert into metrics (uid, type, dur, hashedPc, created) values " +
      entries.join(",") +
      ";",
    []
  )
    .then(function () {
      res.json({});
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_metrics_post", err);
    });
}

function handle_GET_zinvites(
  req: { p: { zid: any; uid?: any } },
  res: {
    writeHead: (arg0: number) => void;
    json: (arg0: { status: number }) => void;
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: { codes: any }): void; new (): any };
    };
  }
) {
  // if uid is not conversation owner, fail
  pgQuery_readOnly(
    "SELECT * FROM conversations WHERE zid = ($1) AND owner = ($2);",
    [req.p.zid, req.p.uid],
    function (err: any, results: { rows: any }) {
      if (err) {
        fail(
          res,
          500,
          "polis_err_fetching_zinvite_invalid_conversation_or_owner",
          err
        );
        return;
      }
      if (!results || !results.rows) {
        res.writeHead(404);
        res.json({
          status: 404,
        });
        return;
      }
      pgQuery_readOnly(
        "SELECT * FROM zinvites WHERE zid = ($1);",
        [req.p.zid],
        function (err: any, results: { rows: any }) {
          if (err) {
            fail(
              res,
              500,
              "polis_err_fetching_zinvite_invalid_conversation_or_owner_or_something",
              err
            );
            return;
          }
          if (!results || !results.rows) {
            res.writeHead(404);
            res.json({
              status: 404,
            });
            return;
          }
          res.status(200).json({
            codes: results.rows, // _.pluck(results.rows[0],"code");
          });
        }
      );
    }
  );
}

function generateConversationURLPrefix() {
  // not 1 or 0 since they look like "l" and "O"
  return "" + _.random(2, 9);
}

function generateSUZinvites(numTokens: number) {
  return new Promise(function (
    resolve: (arg0: any) => void,
    reject: (arg0: Error) => void
  ) {
    generateToken(
      31 * numTokens,
      true, // For now, pseodorandom bytes are probably ok. Anticipating API call will generate lots of these at once, possibly draining the entropy pool. Revisit this if the otzinvites really need to be unguessable.
      function (err: any, longStringOfTokens?: string) {
        if (err) {
          reject(new Error("polis_err_creating_otzinvite"));
          return;
        }
        let otzinviteArrayRegexMatch = longStringOfTokens?.match(/.{1,31}/g);
        let otzinviteArray = otzinviteArrayRegexMatch?.slice(0, numTokens); // Base64 encoding expands to extra characters, so trim to the number of tokens we want.
        otzinviteArray = otzinviteArray?.map(function (suzinvite: string) {
          return generateConversationURLPrefix() + suzinvite;
        });
        resolve(otzinviteArray);
      }
    );
  });
}

function handle_POST_zinvites(
  req: { p: { short_url: any; zid: any; uid?: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: { zinvite: any }): void; new (): any };
    };
  }
) {
  let generateShortUrl = req.p.short_url;

  pgQuery(
    "SELECT * FROM conversations WHERE zid = ($1) AND owner = ($2);",
    [req.p.zid, req.p.uid],
    function (err: any) {
      if (err) {
        fail(
          res,
          500,
          "polis_err_creating_zinvite_invalid_conversation_or_owner",
          err
        );
        return;
      }

      generateAndRegisterZinvite(req.p.zid, generateShortUrl)
        .then(function (zinvite: any) {
          res.status(200).json({
            zinvite: zinvite,
          });
        })
        .catch(function (err: any) {
          fail(res, 500, "polis_err_creating_zinvite", err);
        });
    }
  );
}

function checkZinviteCodeValidity(
  zid: any,
  zinvite: any,
  callback: {
    (err: any, foo: any): void;
    (err: any, foo: any): void;
    (err: any): void;
    (arg0: number | null): void;
  }
) {
  pgQuery_readOnly(
    "SELECT * FROM zinvites WHERE zid = ($1) AND zinvite = ($2);",
    [zid, zinvite],
    function (err: any, results: { rows: string | any[] }) {
      if (err || !results || !results.rows || !results.rows.length) {
        callback(1);
      } else {
        callback(null); // ok
      }
    }
  );
}

let zidToConversationIdCache = new LruCache({
  max: 1000,
});

function getZinvite(zid: any, dontUseCache?: boolean) {
  let cachedConversationId = zidToConversationIdCache.get(zid);
  if (!dontUseCache && cachedConversationId) {
    return Promise.resolve(cachedConversationId);
  }
  return pgQueryP_metered(
    "getZinvite",
    "select * from zinvites where zid = ($1);",
    [zid]
  ).then(function (rows: any) {
    let conversation_id = (rows && rows[0] && rows[0].zinvite) || void 0;
    if (conversation_id) {
      zidToConversationIdCache.set(zid, conversation_id);
    }
    return conversation_id;
  });
}

function getZinvites(zids: any[]) {
  if (!zids.length) {
    return Promise.resolve(zids);
  }
  zids = _.map(zids, function (zid: any) {
    return Number(zid); // just in case
  });
  zids = _.uniq(zids);

  let uncachedZids = zids.filter(function (zid: any) {
    return !zidToConversationIdCache.get(zid);
  });
  let zidsWithCachedConversationIds = zids
    .filter(function (zid: any) {
      return !!zidToConversationIdCache.get(zid);
    })
    .map(function (zid: any) {
      return {
        zid: zid,
        zinvite: zidToConversationIdCache.get(zid),
      };
    });

  function makeZidToConversationIdMap(arrays: any[]) {
    let zid2conversation_id = {};
    arrays.forEach(function (a: any[]) {
      a.forEach(function (o: { zid: string | number; zinvite: any }) {
        // (property) zid: string | number
        // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
        //           No index signature with a parameter of type 'string' was found onpe '{}'.ts(7053)
        // @ts-ignore
        zid2conversation_id[o.zid] = o.zinvite;
      });
    });
    return zid2conversation_id;
  }

  return meteredPromise("getZinvites", new Promise(function (
    resolve: (arg0: {}) => void,
    reject: (arg0: any) => void
  ) {
    if (uncachedZids.length === 0) {
      resolve(makeZidToConversationIdMap([zidsWithCachedConversationIds]));
      return;
    }
    pgQuery_readOnly(
      "select * from zinvites where zid in (" + uncachedZids.join(",") + ");",
      [],
      function (err: any, result: { rows: any }) {
        if (err) {
          reject(err);
        } else {
          resolve(
            makeZidToConversationIdMap([
              result.rows,
              zidsWithCachedConversationIds,
            ])
          );
        }
      }
    );
  }));
}

function addConversationId(
  o: { zid?: any; conversation_id?: any },
  dontUseCache: any
) {
  if (!o.zid) {
    // if no zid, resolve without fetching zinvite.
    return Promise.resolve(o);
  }
  return getZinvite(o.zid, dontUseCache).then(function (
    conversation_id: any
  ) {
    o.conversation_id = conversation_id;
    return o;
  });
}

function addConversationIds(a: any[]) {
  let zids = [];
  for (var i = 0; i < a.length; i++) {
    if (a[i].zid) {
      zids.push(a[i].zid);
    }
  }
  if (!zids.length) {
    return Promise.resolve(a);
  }
  return getZinvites(zids).then(function (zid2conversation_id: {
    [x: string]: any;
  }) {
    return a.map(function (o: {
      conversation_id: any;
      zid: string | number;
    }) {
      o.conversation_id = zid2conversation_id[o.zid];
      return o;
    });
  });
}

function finishOne(
  res: {
    status: (arg0: any) => {
      (): any;
      new (): any;
      json: { (arg0: any): void; new (): any };
    };
  },
  o: { url?: string; zid?: any; currentPid?: any },
  dontUseCache?: boolean | undefined,
  altStatusCode?: number | undefined
) {
  addConversationId(o, dontUseCache)
    .then(
      function (item: any) {
        // ensure we don't expose zid
        if (item.zid) {
          delete item.zid;
        }
        let statusCode = altStatusCode || 200;
        res.status(statusCode).json(item);
      },
      function (err: any) {
        fail(res, 500, "polis_err_finishing_responseA", err);
      }
    )
    .catch(function (err: any) {
      fail(res, 500, "polis_err_finishing_response", err);
    });
}

function finishArray(
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: any): void; new (): any };
    };
  },
  a: any
) {
  addConversationIds(a)
    .then(
      function (items: string | any[]) {
        // ensure we don't expose zid
        if (items) {
          for (var i = 0; i < items.length; i++) {
            if (items[i].zid) {
              delete items[i].zid;
            }
          }
        }
        res.status(200).json(items);
      },
      function (err: any) {
        fail(res, 500, "polis_err_finishing_response2A", err);
      }
    )
    .catch(function (err: any) {
      fail(res, 500, "polis_err_finishing_response2", err);
    });
}

function checkSuzinviteCodeValidity(
  zid: any,
  suzinvite: any,
  callback: {
    (err: any, foo: any): void;
    (err: any, foo: any): void;
    (err: any): void;
    (arg0: number | null): void;
  }
) {
  pgQuery(
    "SELECT * FROM suzinvites WHERE zid = ($1) AND suzinvite = ($2);",
    [zid, suzinvite],
    function (err: any, results: { rows: string | any[] }) {
      if (err || !results || !results.rows || !results.rows.length) {
        callback(1);
      } else {
        callback(null); // ok
      }
    }
  );
}

function getSUZinviteInfo(suzinvite: any) {
  return new Promise(function (
    resolve: (arg0: any) => void,
    reject: (arg0: Error) => any
  ) {
    pgQuery(
      "SELECT * FROM suzinvites WHERE suzinvite = ($1);",
      [suzinvite],
      function (err: any, results: { rows: string | any[] }) {
        if (err) {
          return reject(err);
        }
        if (!results || !results.rows || !results.rows.length) {
          return reject(new Error("polis_err_no_matching_suzinvite"));
        }
        resolve(results.rows[0]);
      }
    );
  });
}

async function deleteSuzinvite(suzinvite: any) {
  try {
    await pgQueryP(
      "DELETE FROM suzinvites WHERE suzinvite = ($1);",
      [suzinvite]);
  } catch (err) {
    logger.error("polis_err_removing_suzinvite", err);
  }
}

function xidExists(xid: any, owner: any, uid?: any) {
  return pgQueryP(
    "select * from xids where xid = ($1) and owner = ($2) and uid = ($3);",
    [xid, owner, uid]
  ).then(function (rows: string | any[]) {
    return rows && rows.length;
  });
}

async function createXidEntry(xid: any, owner: any, uid?: any) {
  try {
    await pgQueryP(
      "INSERT INTO xids (uid, owner, xid) VALUES ($1, $2, $3);",
      [uid, owner, xid]);
  } catch (err) {
    logger.error("polis_err_adding_xid_entry", err);
    throw new Error("polis_err_adding_xid_entry");
  }
}

function saveParticipantMetadataChoicesP(zid: any, pid: any, answers: any) {
  return new Promise(function (
    resolve: (arg0: number) => void,
    reject: (arg0: any) => void
  ) {
    saveParticipantMetadataChoices(zid, pid, answers, function (err: any) {
      if (err) {
        reject(err);
      } else {
        resolve(0);
      }
    });
  });
}

function saveParticipantMetadataChoices(
  zid: any,
  pid: any,
  answers: any[],
  callback: { (err: any): void; (arg0: number): void }
) {
  // answers is a list of pmaid
  if (!answers || !answers.length) {
    // nothing to save
    return callback(0);
  }

  let q =
    "select * from participant_metadata_answers where zid = ($1) and pmaid in (" +
    answers.join(",") +
    ");";

  pgQuery(
    q,
    [zid],
    function (
      err: any,
      qa_results: { [x: string]: { pmqid: any }; rows: any }
    ) {
      if (err) {
        logger.error("polis_err_getting_participant_metadata_answers", err);
        return callback(err);
      }

      qa_results = qa_results.rows;
      // Property 'rows' is missing in type 'Dictionary<{ pmqid: any; }>' but required in type '{ [x: string]: { pmqid: any; }; rows: any; }'.ts(2741)
      // @ts-ignore
      qa_results = _.indexBy(qa_results, "pmaid");
      // construct an array of params arrays
      answers = answers.map(function (pmaid: string | number) {
        let pmqid = qa_results[pmaid].pmqid;
        return [zid, pid, pmaid, pmqid];
      });
      // make simultaneous requests to insert the choices
      async.map(
        answers,
        function (x: any, cb: (arg0: number) => void) {
          // ...insert()
          //     .into("participant_metadata_choices")
          //     .
          pgQuery(
            "INSERT INTO participant_metadata_choices (zid, pid, pmaid, pmqid) VALUES ($1,$2,$3,$4);",
            x,
            function (err: any) {
              if (err) {
                logger.error(
                  "polis_err_saving_participant_metadata_choices",
                  err
                );
                return cb(err);
              }
              cb(0);
            }
          );
        },
        function (err: any) {
          if (err) {
            logger.error(
              "polis_err_saving_participant_metadata_choices",
              err
            );
            return callback(err);
          }
          // finished with all the inserts
          callback(0);
        }
      );
    }
  );
}

function updateLastInteractionTimeForConversation(zid: any, uid?: any) {
  return pgQueryP(
    "update participants set last_interaction = now_as_millis(), nsli = 0 where zid = ($1) and uid = ($2);",
    [zid, uid]
  );
}
function populateGeoIpInfo(zid: any, uid?: any, ipAddress?: string | null) {
  var userId = Config.maxmindUserID;
  var licenseKey = Config.maxmindLicenseKey;

  var url = "https://geoip.maxmind.com/geoip/v2.1/city/";
  var contentType =
    "application/vnd.maxmind.com-city+json; charset=UTF-8; version=2.1";

  // "city" is     $0.0004 per query
  // "insights" is $0.002  per query
  var insights = false;

  if (insights) {
    url = "https://geoip.maxmind.com/geoip/v2.1/insights/";
    contentType =
      "application/vnd.maxmind.com-insights+json; charset=UTF-8; version=2.1";
  }
  //   No overload matches this call.
  // Overload 1 of 3, '(uri: string, options?: RequestPromiseOptions | undefined, callback?: RequestCallback | undefined): RequestPromise<any>', gave the following error.
  //   Argument of type '{ method: string; contentType: string; headers: { Authorization: string; }; }' is not assignable to parameter of type 'RequestPromiseOptions'.
  //     Object literal may only specify known properties, and 'contentType' does not exist in type 'RequestPromiseOptions'.
  // Overload 2 of 3, '(uri: string, callback?: RequestCallback | undefined): RequestPromise<any>', gave the following error.
  //   Argument of type '{ method: string; contentType: string; headers: { Authorization: string; }; }' is not assignable to parameter of type 'RequestCallback'.
  //     Object literal may only specify known properties, and 'method' does not exist in type 'RequestCallback'.
  // Overload 3 of 3, '(options: RequiredUriUrl & RequestPromiseOptions, callback?: RequestCallback | undefined): RequestPromise<any>', gave the following error.
  //   Argument of type 'string' is not assignable to parameter of type 'RequiredUriUrl & RequestPromiseOptions'.ts(2769)
  // @ts-ignore
  return request
    .get(url + ipAddress, {
      method: "GET",
      contentType: contentType,
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(userId + ":" + licenseKey, "utf8").toString("base64"),
      },
    })
    .then(function (response: string) {
      var parsedResponse = JSON.parse(response);
      logger.debug("maxmind response", parsedResponse);

      return pgQueryP(
        "update participants_extended set modified=now_as_millis(), country_iso_code=($4), encrypted_maxmind_response_city=($3), " +
          "location=ST_GeographyFromText('SRID=4326;POINT(" +
          parsedResponse.location.latitude +
          " " +
          parsedResponse.location.longitude +
          ")'), latitude=($5), longitude=($6) where zid = ($1) and uid = ($2);",
        [
          zid,
          uid,
          encrypt(response),
          parsedResponse.country.iso_code,
          parsedResponse.location.latitude,
          parsedResponse.location.longitude,
        ]
      );
    });
}

function addExtendedParticipantInfo(zid: any, uid?: any, data?: {}) {
  if (!data || !_.keys(data).length) {
    return Promise.resolve();
  }

  let params = Object.assign({}, data, {
    zid: zid,
    uid: uid,
    modified: 9876543212345, // hacky string, will be replaced with the word "default".
  });
  let qUpdate = sql_participants_extended
    .update(params)
    .where(sql_participants_extended.zid.equals(zid))
    .and(sql_participants_extended.uid.equals(uid));
  let qString = qUpdate.toString();
  qString = qString.replace("9876543212345", "now_as_millis()");
  return pgQueryP(qString, []);
}

function tryToJoinConversation(
  zid: any,
  uid?: any,
  info?: any,
  pmaid_answers?: string | any[]
) {
  function doAddExtendedParticipantInfo() {
    if (info && _.keys(info).length > 0) {
      addExtendedParticipantInfo(zid, uid, info);
    }
  }

  function saveMetadataChoices(pid?: number) {
    if (pmaid_answers && pmaid_answers.length) {
      saveParticipantMetadataChoicesP(zid, pid, pmaid_answers);
    }
  }

  return addParticipant(zid, uid).then(function (rows: any[]) {
    let ptpt = rows[0];

    doAddExtendedParticipantInfo();

    if (pmaid_answers && pmaid_answers.length) {
      saveMetadataChoices();
    }
    return ptpt;
  });
}

function addParticipantAndMetadata(
  zid: any,
  uid?: any,
  req?: {
    cookies: { [x: string]: any };
    p: { parent_url: any };
    headers?: { [x: string]: any };
  },
  permanent_cookie?: any
) {
  let info: { [key: string]: string } = {};
  let parent_url = req?.cookies?.[COOKIES.PARENT_URL] || req?.p?.parent_url;
  let referer =
    req?.cookies[COOKIES.PARENT_REFERRER] ||
    req?.headers?.["referer"] ||
    req?.headers?.["referrer"];
  if (parent_url) {
    info.parent_url = parent_url;
  }
  if (referer) {
    info.referrer = referer;
  }
  let x_forwarded_for = req?.headers?.["x-forwarded-for"];
  let ip: string | null = null;
  if (x_forwarded_for) {
    let ips = x_forwarded_for;
    ips = ips && ips.split(", ");
    ip = ips.length && ips[0];
    info.encrypted_ip_address = encrypt(ip);
    info.encrypted_x_forwarded_for = encrypt(x_forwarded_for);
  }
  if (permanent_cookie) {
    info.permanent_cookie = permanent_cookie;
  }
  if (req?.headers?.["origin"]) {
    info.origin = req?.headers?.["origin"];
  }
  return addParticipant(zid, uid).then((rows: any[]) => {
    addExtendedParticipantInfo(zid, uid, info);
    if (ip) {
      populateGeoIpInfo(zid, uid, ip);
    }
    return rows;
  });
}

function joinConversation(
  zid: any,
  uid?: any,
  info?: {},
  pmaid_answers?: any
) {
  function tryJoin() {
    return tryToJoinConversation(zid, uid, info, pmaid_answers);
  }

  function doJoin() {
    // retry up to 10 times
    // NOTE: Shouldn't be needed, since we have an advisory lock in the insert trigger.
    //       However, that doesn't seem to be preventing duplicate pid constraint errors.
    //       Doing this retry in JS for now since it's quick and easy, rather than try to
    //       figure what's wrong with the postgres locks.
    let promise = tryJoin()
      .catch(tryJoin)
      .catch(tryJoin)
      .catch(tryJoin)
      .catch(tryJoin)
      .catch(tryJoin)
      .catch(tryJoin)
      .catch(tryJoin)
      .catch(tryJoin)
      .catch(tryJoin);
    return promise;
  }

  return getPidPromise(zid, uid).then(function (pid: number) {
    if (pid >= 0) {
      // already a ptpt, so don't create another
      return;
    } else {
      return doJoin();
    }
  }, doJoin);
}

function isOwnerOrParticipant(
  zid: any,
  uid?: any,
  callback?: { (): void; (arg0: null): void }
) {
  // TODO should be parallel.
  // look into bluebird, use 'some' https://github.com/petkaantonov/bluebird
  getPid(zid, uid, function (err: any, pid: number) {
    if (err || pid < 0) {
      isConversationOwner(zid, uid, function (err: any) {
        callback?.(err);
      });
    } else {
      callback?.(null);
    }
  });
}

function isConversationOwner(
  zid: any,
  uid?: any,
  callback?: {
    (err: any): void;
    (err: any): void;
    (err: any): void;
    (err: any, foo: any): void;
    (err: any, foo: any): void;
    (arg0: any): void;
  }
) {
  // if (true) {
  //     callback(null); // TODO remove!
  //     return;
  // }
  pgQuery_readOnly(
    "SELECT * FROM conversations WHERE zid = ($1) AND owner = ($2);",
    [zid, uid],
    function (err: number, docs: { rows: string | any[] }) {
      if (!docs || !docs.rows || docs.rows.length === 0) {
        err = err || 1;
      }
      callback?.(err);
    }
  );
}

function isOwner(zid: any, uid: string) {
  return getConversationInfo(zid).then(function (info: any) {
    return info.owner === uid;
  });
}

function isModerator(zid: any, uid?: any) {
  if (isPolisDev(uid)) {
    return Promise.resolve(true);
  }
  return pgQueryP_readOnly(
    "select count(*) from conversations where owner in (select uid from users where site_id = (select site_id from users where uid = ($2))) and zid = ($1);",
    [zid, uid]
  ).then(function (rows: { count: number }[]) {
    return rows[0].count >= 1;
  });
}

// returns null if it's missing
function getParticipant(zid: any, uid?: any) {
  return meteredPromise("getParticipant", new Promise(function (
    resolve: (arg0: any) => void,
    reject: (arg0: Error) => any
  ) {
    pgQuery_readOnly(
      "SELECT * FROM participants WHERE zid = ($1) AND uid = ($2);",
      [zid, uid],
      function (err: any, results: { rows: any[] }) {
        if (err) {
          return reject(err);
        }
        if (!results || !results.rows) {
          return reject(new Error("polis_err_getParticipant_failed"));
        }
        resolve(results.rows[0]);
      }
    );
  }));
}
function getAnswersForConversation(
  zid: any,
  callback: {
    (err: any, available_answers: any): any;
    (arg0: number, arg1?: undefined): void;
  }
) {
  pgQuery_readOnly(
    "SELECT * from participant_metadata_answers WHERE zid = ($1) AND alive=TRUE;",
    [zid],
    function (err: any, x: { rows: any }) {
      if (err) {
        callback(err);
        return;
      }
      callback(0, x.rows);
    }
  );
}

function getChoicesForConversation(zid: any) {
  return new Promise(function (
    resolve: (arg0: never[]) => void,
    reject: (arg0: any) => void
  ) {
    pgQuery_readOnly(
      "select * from participant_metadata_choices where zid = ($1) and alive = TRUE;",
      [zid],
      function (err: any, x: { rows: any }) {
        if (err) {
          reject(err);
          return;
        }
        if (!x || !x.rows) {
          resolve([]);
          return;
        }
        resolve(x.rows);
      }
    );
  });
}

const getUserInfoForUid = User.getUserInfoForUid;
const getUserInfoForUid2 = User.getUserInfoForUid2;

function emailTeam(subject: string, body: string) {
  return sendMultipleTextEmails(
    polisFromAddress,
    adminEmails,
    subject,
    body
  ).catch(function (err: any) {
    logger.error("polis_err_failed_to_email_team", err);
  });
}

function emailBadProblemTime(message: string) {
  const body = `Yo, there was a serious problem. Here's the message:

${message}`;

  return emailTeam("Polis Bad Problems!!!", body);
}
async function sendPasswordResetEmail(
  uid?: any,
  pwresettoken?: any,
  serverName?: any,
) {
  const userInfo = await getUserInfoForUid(uid) as { hname: any; email: any };
  if(!userInfo) {
    throw new Error("missing user info");
  }

  let body = `Hi ${userInfo.hname},

We have just received a password reset request for ${userInfo.email}

To reset your password, visit this page:
${serverName}/pwreset/${pwresettoken}

"Thank you for using Metropolis!`;

  try {
    await sendTextEmail(
      polisFromAddress,
      userInfo.email,
      "Polis Password Reset",
      body
    );
  } catch (err) {
    logger.error("polis_err_failed_to_email_password_reset_code", err);
    throw err;
  }
}

// function sendTextEmailWithPostmark(sender, recipient, subject, text) {
//   return new Promise(function(resolve, reject) {
//     postmark.send({
//       "From": sender,
//       "To": recipient,
//       "Subject": subject,
//       "TextBody": text,
//     }, function(error, success) {
//       if (error) {
//         yell("polis_err_postmark_email_send_failed");
//         reject(error);
//       } else {
//         resolve();
//       }
//     });
//   });
// }
function sendMultipleTextEmails(
  sender: string | undefined,
  recipientArray: any[],
  subject: string,
  text: string
) {
  recipientArray = recipientArray || [];
  return Promise.all(
    recipientArray.map(function (email: string) {
      let promise = sendTextEmail(sender, email, subject, text);
      promise.catch(function (err: any) {
        logger.error("polis_err_failed_to_email_for_user", { email, err });
      });
      return promise;
    })
  );
}

function sendEinviteEmail(req: any, email: any, einvite: any) {
  let serverName = getServerNameWithProtocol(req);
  const body = `Welcome to Metropolis!

Click this link to open your account:

${serverName}/welcome/${einvite}`;

  return sendTextEmail(
    polisFromAddress,
    email,
    "Get Started with Polis",
    body
  );
}

async function handle_GET_verification(
  req: { p: { e: any } },
  res: {
    set: (arg0: string, arg1: string) => void;
    send: (arg0: string) => void;
  }
) {
  let einvite = req.p.e;

  let emailRows;
  try {
    emailRows = await pgQueryP("select * from einvites where einvite = ($1);", [einvite])
  } catch (err) {
    fail(res, 500, "polis_err_verification", err);
    return;
  }

  if (!emailRows.length) {
    fail(res, 500, "polis_err_verification_missing");
    return;
  }

  let email = emailRows[0].email;

  const emailValidations = await pgQueryP("select email from email_validations where email = ($1);", [email]);

  if(emailValidations.length == 0) {
    await pgQueryP(
      "insert into email_validations (email) values ($1);",
      [email]
    );
  }

  res.set("Content-Type", "text/html");
  res.send(
  `<html><body>
<div style='font-family: Futura, Helvetica, sans-serif;'>
Email verified! You can close this tab or hit the back button.
</div>
</body></html>`
  );
}

function paramsToStringSortedByName(params: {
  conversation_id?: any;
  email?: any;
}) {
  // Argument of type '(a: number[], b: number[]) => boolean' is not assignable to parameter of type '(a: ["email" | "conversation_id", any], b: ["email" | "conversation_id", any]) => number'.
  //   Type 'boolean' is not assignable to type 'number'.ts(2345)
  // @ts-ignore
  let pairs = _.pairs(params).sort(function (a: number[], b: number[]) {
    return a[0] > b[0];
  });
  const pairsList = pairs.map(function (pair: any[]) {
    return pair.join("=");
  });
  return pairsList.join("&");
}

// // units are seconds
// let expirationPolicies = {
//     pwreset_created : 60 * 60 * 2,
// };

let HMAC_SIGNATURE_PARAM_NAME = "signature";

function createHmacForQueryParams(
  path: string,
  params: { conversation_id?: any; email?: any }
) {
  path = path.replace(/\/$/, ""); // trim trailing "/"
  let s = path + "?" + paramsToStringSortedByName(params);
  let hmac = crypto.createHmac(
    "sha1",
    "G7f387ylIll8yuskuf2373rNBmcxqWYFfHhdsd78f3uekfs77EOLR8wofw"
  );
  hmac.setEncoding("hex");
  hmac.write(s);
  hmac.end();
  let hash = hmac.read();
  return hash;
}

function verifyHmacForQueryParams(
  path: string,
  params: { [x: string]: any; conversation_id?: any; email?: any }
) {
  return new Promise(function (resolve, reject) {
    params = _.clone(params);
    let hash = params[HMAC_SIGNATURE_PARAM_NAME];
    delete params[HMAC_SIGNATURE_PARAM_NAME];
    let correctHash = createHmacForQueryParams(path, params);
    // To thwart timing attacks, add some randomness to the response time with setTimeout.
    setTimeout(function () {
      logger.debug("comparing", { correctHash, hash });
      if (correctHash === hash) {
        resolve(undefined);
      } else {
        reject();
      }
    });
  });
}

function sendEmailByUid(uid?: any, subject?: string, body?: string | number) {
  return getUserInfoForUid2(uid).then(function (userInfo: any) {
    return sendTextEmail(
      polisFromAddress,
      userInfo.hname
        ? `${userInfo.hname} <${userInfo.email}>`
        : userInfo.email,
      subject,
      body
    );
  });
}

function handle_GET_participants(
  req: { p: { zid: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: any): void; new (): any };
    };
  }
) {
  let zid = req.p.zid;

  pgQueryP_readOnly(
    "SELECT users.hname, participants.pid, participants.vote_count, participants.last_interaction, participants.created FROM users INNER JOIN participants ON users.uid = participants.uid WHERE zid = ($1) ORDER BY participants.pid;",
    [zid]
  )
    .then(function (rows: string | any[]) {
      res.status(200).json(rows);
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_get_participant", err);
    });
}

function doGetConversationsRecent(
  req: { p: { uid?: any; sinceUnixTimestamp: any } },
  res: { json: (arg0: any) => void },
  field: string
) {
  if (!isPolisDev(req.p.uid)) {
    fail(res, 403, "polis_err_no_access_for_this_user");
    return;
  }
  var time = req.p.sinceUnixTimestamp;
  if (_.isUndefined(time)) {
    time = Date.now() - 1000 * 60 * 60 * 24 * 7;
  } else {
    time *= 1000;
  }
  time = parseInt(time);
  pgQueryP_readOnly(
    "select * from conversations where " + field + " >= ($1);",
    [time]
  )
    .then((rows: any) => {
      res.json(rows);
    })
    .catch((err: any) => {
      fail(res, 403, "polis_err_conversationsRecent", err);
    });
}

function handle_GET_conversationsRecentlyStarted(req: any, res: any) {
  doGetConversationsRecent(req, res, "created");
}

function handle_GET_conversationsRecentActivity(req: any, res: any) {
  doGetConversationsRecent(req, res, "modified");
}

function userHasAnsweredZeQuestions(zid: any, answers: string | any[]) {
  return meteredPromise(
    "userHasAnsweredZeQuestions",
    new Promise(function (resolve, reject) {
      getAnswersForConversation(
        zid,
        function (err: any, available_answers: any) {
          if (err) {
            reject(err);
            return;
          }

          let q2a = _.indexBy(available_answers, "pmqid");
          let a2q = _.indexBy(available_answers, "pmaid");
          for (var i = 0; i < answers.length; i++) {
            let pmqid = a2q[answers[i]].pmqid;
            delete q2a[pmqid];
          }
          let remainingKeys = _.keys(q2a);
          let missing = remainingKeys && remainingKeys.length > 0;
          if (missing) {
            return reject(
              new Error(
                "polis_err_metadata_not_chosen_pmqid_" + remainingKeys[0]
              )
            );
          } else {
            return resolve(undefined);
          }
        }
      );
    }
  ));
}
function handle_POST_participants(
  req: {
    p: { zid: any; uid?: any; answers: any; parent_url: any; referrer: any };
    cookies: { [x: string]: any };
  },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: any): void; new (): any };
    };
  }
) {
  let zid = req.p.zid;
  let uid = req.p.uid;
  let answers = req.p.answers;
  let info: ParticipantInfo = {};

  let parent_url = req.cookies[COOKIES.PARENT_URL] || req.p.parent_url;
  let referrer = req.cookies[COOKIES.PARENT_REFERRER] || req.p.referrer;

  if (parent_url) {
    info.parent_url = parent_url;
  }
  if (referrer) {
    info.referrer = referrer;
  }

  function finish(ptpt: any) {
    // Probably don't need pid cookies..?
    // function getZidToPidCookieKey(zid) {
    //     return zid + "p";
    // }
    // addCookie(res, getZidToPidCookieKey(zid), pid);

    clearCookie(req, res, COOKIES.PARENT_URL);
    clearCookie(req, res, COOKIES.PARENT_REFERRER);

    setTimeout(function () {
      updateLastInteractionTimeForConversation(zid, uid);
    }, 0);
    res.status(200).json(ptpt);
  }

  function doJoin() {
    userHasAnsweredZeQuestions(zid, answers).then(
      function () {
        joinConversation(zid, uid, info, answers).then(
          function (ptpt: any) {
            finish(ptpt);
          },
          function (err: any) {
            fail(res, 500, "polis_err_add_participant", err);
          }
        );
      },
      function (err: { message: any }) {
        fail(res, 400, err.message, err);
      }
    );
  }

  // Check if already in the conversation
  getParticipant(zid, req.p.uid)
    .then(
      function (ptpt: { pid: any }) {
        if (ptpt) {
          finish(ptpt);

          addExtendedParticipantInfo(zid, req.p.uid, info);
          return;
        }

        getConversationInfo(zid)
          .then(function () {
            doJoin();
          })
          .catch(function (err: any) {
            fail(
              res,
              500,
              "polis_err_post_participants_need_uid_to_check_lti_users_4",
              err
            );
          });
      },
      function (err: any) {
        fail(res, 500, "polis_err_post_participants_db_err", err);
      }
    )
    .catch(function (err: any) {
      fail(res, 500, "polis_err_post_participants_misc", err);
    });
}

async function subscribeToNotifications(zid: any, uid?: any, email?: any) {
  let type = 1; // 1 for email
  logger.info("subscribeToNotifications", { zid, uid });
  await pgQueryP(
    "update participants_extended set subscribe_email = ($3) where zid = ($1) and uid = ($2);",
    [zid, uid, email]
  );

  await pgQueryP(
    "update participants set subscribed = ($3) where zid = ($1) and uid = ($2);",
    [zid, uid, type]
  );

  return type;
}

async function unsubscribeFromNotifications(zid: any, uid?: any) {
  let type = 0; // 1 for nothing
  await pgQueryP(
    "update participants set subscribed = ($3) where zid = ($1) and uid = ($2);",
    [zid, uid, type]
  );
  return type;
}

function addNotificationTask(zid: any) {
  return pgQueryP(
    "insert into notification_tasks (zid) values ($1) on conflict (zid) do update set modified = now_as_millis();",
    [zid]
  );
}

function maybeAddNotificationTask(zid: any, timeInMillis: any) {
  return pgQueryP(
    "insert into notification_tasks (zid, modified) values ($1, $2) on conflict (zid) do nothing;",
    [zid, timeInMillis]
  );
}

function claimNextNotificationTask() {
  return pgQueryP(
    "delete from notification_tasks where zid = (select zid from notification_tasks order by random() for update skip locked limit 1) returning *;"
  ).then((rows: string | any[]) => {
    if (!rows || !rows.length) {
      return null;
    }
    return rows[0];
  });
}

function getDbTime() {
  return pgQueryP("select now_as_millis();", []
  ).then((rows: { now_as_millis: any }[]) => {
      return rows[0].now_as_millis;
    }
  );
}

function doNotificationsForZid(zid: any, timeOfLastEvent: any) {
  let shouldTryAgain = false;

  return (
    pgQueryP(
      "select * from participants where zid = ($1) and last_notified < ($2) and subscribed > 0;",
      [zid, timeOfLastEvent]
    )
      .then((candidates: any[]) => {
        if (!candidates || !candidates.length) {
          return null;
        }
        candidates = candidates.map(
          (ptpt: { last_notified: number; last_interaction: number }) => {
            ptpt.last_notified = Number(ptpt.last_notified);
            ptpt.last_interaction = Number(ptpt.last_interaction);
            return ptpt;
          }
        );
        return Promise.all([
          getDbTime(),
          getConversationInfo(zid),
          getZinvite(zid),
        ]).then((a: any[]) => {
          let dbTimeMillis = a[0];
          let conv = a[1];
          let conversation_id = a[2];

          let url = conv.parent_url || "https://pol.is/" + conversation_id;

          let pid_to_ptpt = {};
          candidates.forEach((c: { pid: string | number }) => {
            // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
            // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
            // @ts-ignore
            pid_to_ptpt[c.pid] = c;
          });
          return Promise.all(candidates.map((item: { zid: any; pid: any }) =>
            getNumberOfCommentsRemaining(item.zid, item.pid).then(
              (rows: any[]) => {
                return rows[0];
              }
            )
          )).then((results: any[]) => {
            const needNotification = results.filter(
              (result: { pid: string | number; remaining: number }) => {
                // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
                // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
                // @ts-ignore
                let ptpt = pid_to_ptpt[result.pid];
                let needs = true;

                needs = needs && result.remaining > 0;

                // if (needs && result.remaining < 5) {
                //   // no need to try again for this user since new comments will create new tasks
                //   needs = false;
                // }

                let waitTime = 60 * 60 * 1000;

                // notifications since last interation
                if (ptpt.nsli === 0) {
                  // first notification since last interaction
                  waitTime = 60 * 60 * 1000; // 1 hour
                } else if (ptpt.nsli === 1) {
                  // second notification since last interaction
                  waitTime = 2 * 60 * 60 * 1000; // 4 hours
                } else if (ptpt.nsli === 2) {
                  // third notification since last interaction
                  waitTime = 24 * 60 * 60 * 1000; // 24 hours
                } else if (ptpt.nsli === 3) {
                  // third notification since last interaction
                  waitTime = 48 * 60 * 60 * 1000; // 48 hours
                } else {
                  // give up, if they vote again nsli will be set to zero again.
                  needs = false;
                }

                if (needs && dbTimeMillis < ptpt.last_notified + waitTime) {
                  // Limit to one per hour.
                  shouldTryAgain = true;
                  needs = false;
                }
                if (
                  needs &&
                  dbTimeMillis < ptpt.last_interaction + 5 * 60 * 1000
                ) {
                  // Wait until 5 minutes after their last interaction.
                  shouldTryAgain = true;
                  needs = false;
                }

                if (devMode) {
                  needs = needs && isPolisDev(ptpt.uid);
                }
                return needs;
              }
            );

            if (needNotification.length === 0) {
              return null;
            }
            const pids = _.pluck(needNotification, "pid");

            // return pgQueryP("select p.uid, p.pid, u.email from participants as p left join users as u on p.uid = u.uid where p.pid in (" + pids.join(",") + ")", []).then((rows) => {

            // })
            return pgQueryP(
              "select uid, subscribe_email from participants_extended where uid in (select uid from participants where pid in (" +
                pids.join(",") +
                "));",
              []
            ).then((rows: any[]) => {
              let uidToEmail = {};
              rows.forEach(
                (row: { uid: string | number; subscribe_email: any }) => {
                  // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
                  // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
                  // @ts-ignore
                  uidToEmail[row.uid] = row.subscribe_email;
                }
              );

              return Promise.all(
                needNotification.map(
                  (
                    item: { pid: string | number; remaining: any }
                  ) => {
                    // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
                    // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
                    // @ts-ignore
                    const uid = pid_to_ptpt[item.pid].uid;
                    return sendNotificationEmail(
                      uid,
                      url,
                      conversation_id,
                      // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
                      // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
                      // @ts-ignore
                      uidToEmail[uid]
                    ).then(() => {
                      return pgQueryP(
                        "update participants set last_notified = now_as_millis(), nsli = nsli + 1 where uid = ($1) and zid = ($2);",
                        [uid, zid]
                      );
                    });
                  })
              );
            });
          });
        });
      })
      .then(() => {
        return shouldTryAgain;
      })
  );
}
function doNotificationBatch() {
  return claimNextNotificationTask().then(
    (task: { zid: any; modified: any }) => {
      if (!task) {
        return Promise.resolve();
      }
      return doNotificationsForZid(task.zid, task.modified).then(
        (shouldTryAgain: any) => {
          if (shouldTryAgain) {
            // Since we claimed the task above, there will be no record, so we need to
            // put it back to trigger a retry - unless there's a new one there, in which case we should
            // leave the new one.
            maybeAddNotificationTask(task.zid, task.modified);
          }
        }
      );
    }
  );
}

function doNotificationLoop() {
  logger.debug("doNotificationLoop");
  doNotificationBatch().then(() => {
    setTimeout(doNotificationLoop, 10000);
  });
}

function sendNotificationEmail(
  uid?: any,
  url?: string,
  conversation_id?: string,
  email?: any,
) {
  let subject =
    "New statements to vote on (conversation " + conversation_id + ")"; // Not sure if putting the conversation_id is ideal, but we need some way to ensure that the notifications for each conversation appear in separte threads.
  let body = "There are new statements available for you to vote on here:\n";
  body += "\n";
  body += url + "\n";
  body += "\n";
  body +=
    "You're receiving this message because you're signed up to receive Polis notifications for this conversation. You can unsubscribe from these emails by clicking this link:\n";
  body += createNotificationsUnsubscribeUrl(conversation_id, email) + "\n";
  body += "\n";
  body +=
    "If for some reason the above link does not work, please reply directly to this email with the message 'Unsubscribe' and we will remove you within 24 hours.";
  body += "\n";
  body += "Thanks for your participation";
  return sendEmailByUid(uid, subject, body);
}

let shouldSendNotifications = !devMode;
// let shouldSendNotifications = true;
// let shouldSendNotifications = false;
if (shouldSendNotifications) {
  doNotificationLoop();
}
function createNotificationsUnsubscribeUrl(conversation_id: any, email: any) {
  let params = {
    conversation_id: conversation_id,
    email: email,
  };
  let path = "api/v3/notifications/unsubscribe";
  // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
  // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
  // @ts-ignore
  params[HMAC_SIGNATURE_PARAM_NAME] = createHmacForQueryParams(path, params);

  let server = Config.getServerUrl();
  return server + "/" + path + "?" + paramsToStringSortedByName(params);
}

function createNotificationsSubscribeUrl(conversation_id: any, email: any) {
  let params = {
    conversation_id: conversation_id,
    email: email,
  };
  let path = "api/v3/notifications/subscribe";
  // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
  // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
  // @ts-ignore
  params[HMAC_SIGNATURE_PARAM_NAME] = createHmacForQueryParams(path, params);

  let server = Config.getServerUrl();
  return server + "/" + path + "?" + paramsToStringSortedByName(params);
}

function handle_GET_notifications_subscribe(
  req: {
    p: { [x: string]: any; zid: any; email: any; conversation_id: any };
  },
  res: {
    set: (arg0: string, arg1: string) => void;
    send: (arg0: string) => void;
  }
) {
  let zid = req.p.zid;
  let email = req.p.email;
  let params = {
    conversation_id: req.p.conversation_id,
    email: req.p.email,
  };
  // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
  // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
  // @ts-ignore
  params[HMAC_SIGNATURE_PARAM_NAME] = req.p[HMAC_SIGNATURE_PARAM_NAME];
  verifyHmacForQueryParams("api/v3/notifications/subscribe", params)
    .then(
      function () {
        return pgQueryP(
          "update participants set subscribed = 1 where uid = (select uid from users where email = ($2)) and zid = ($1);",
          [zid, email]
        ).then(function () {
          res.set("Content-Type", "text/html");
          res.send(
            `<h1>Subscribed!</h1>
<p>
<a href="${createNotificationsUnsubscribeUrl(
              req.p.conversation_id,
              req.p.email
            )}">oops, unsubscribe me.</a>
</p>`
          );
        });
      },
      function () {
        fail(res, 403, "polis_err_subscribe_signature_mismatch");
      }
    )
    .catch(function (err: any) {
      fail(res, 500, "polis_err_subscribe_misc", err);
    });
}
function handle_GET_notifications_unsubscribe(
  req: {
    p: { [x: string]: any; zid: any; email: any; conversation_id: any };
  },
  res: {
    set: (arg0: string, arg1: string) => void;
    send: (arg0: string) => void;
  }
) {
  let zid = req.p.zid;
  let email = req.p.email;
  let params = {
    conversation_id: req.p.conversation_id,
    email: email,
  };
  // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
  // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
  // @ts-ignore
  params[HMAC_SIGNATURE_PARAM_NAME] = req.p[HMAC_SIGNATURE_PARAM_NAME];
  verifyHmacForQueryParams("api/v3/notifications/unsubscribe", params)
    .then(
      function () {
        return pgQueryP(
          "update participants set subscribed = 0 where uid = (select uid from users where email = ($2)) and zid = ($1);",
          [zid, email]
        ).then(function () {
          res.set("Content-Type", "text/html");
          res.send(
            `<h1>Unsubscribed.</h1>
<p>
<a href="${createNotificationsSubscribeUrl(
              req.p.conversation_id,
              req.p.email
            )}">oops, subscribe me again.</a>
</p>`
          );
        });
      },
      function () {
        fail(res, 403, "polis_err_unsubscribe_signature_mismatch");
      }
    )
    .catch(function (err: any) {
      fail(res, 500, "polis_err_unsubscribe_misc", err);
    });
}
function handle_POST_convSubscriptions(
  req: { p: { zid: any; uid?: any; type: any; email: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: { subscribed: any }): void; new (): any };
    };
  }
) {
  let zid = req.p.zid;
  let uid = req.p.uid;
  let type = req.p.type;

  let email = req.p.email;

  function finish(type: any) {
    res.status(200).json({
      subscribed: type,
    });
  }

  if (type === 1) {
    subscribeToNotifications(zid, uid, email)
      .then(finish)
      .catch(function (err: any) {
        fail(res, 500, "polis_err_sub_conv " + zid + " " + uid, err);
      });
  } else if (type === 0) {
    unsubscribeFromNotifications(zid, uid)
      .then(finish)
      .catch(function (err: any) {
        fail(res, 500, "polis_err_unsub_conv " + zid + " " + uid, err);
      });
  } else {
    fail(
      res,
      400,
      "polis_err_bad_subscription_type",
      new Error("polis_err_bad_subscription_type")
    );
  }
}

function handle_POST_auth_login(
  req: {
    p: {
      password: any;
      email: string;
    };
  },
  res: {
    redirect: (arg0: any) => void;
    json: (arg0: { uid?: any; email: any; token: any }) => void;
  }
) {
  let password = req.p.password;
  let email = req.p.email || "";

  email = email.toLowerCase();
  if (!_.isString(password) || !password.length) {
    fail(res, 403, "polis_err_login_need_password");
    return;
  }
  pgQuery(
    "SELECT * FROM users WHERE LOWER(email) = ($1);",
    [email],
    function (err: any, docs: { rows?: any[] }) {
      const { rows } = docs;
      if (err) {
        fail(res, 403, "polis_err_login_unknown_user_or_password", err);
        return;
      }
      if (!rows || rows.length === 0) {
        fail(res, 403, "polis_err_login_unknown_user_or_password_noresults");
        return;
      }

      let uid = rows[0].uid;

      pgQuery(
        "select pwhash from jianiuevyew where uid = ($1);",
        [uid],
        function (err: any, results: { rows: any[] }) {
          // results: { pwhash: any }[]
          const { rows } = results;
          if (err) {
            fail(res, 403, "polis_err_login_unknown_user_or_password", err);
            return;
          }
          if (!results || rows.length === 0) {
            fail(res, 403, "polis_err_login_unknown_user_or_password");
            return;
          }

          let hashedPassword = rows[0].pwhash;

          bcrypt.compare(
            password,
            hashedPassword,
            function (errCompare: any, result: any) {
              logger.debug("errCompare, result", { errCompare, result });
              if (errCompare || !result) {
                fail(res, 403, "polis_err_login_unknown_user_or_password");
                return;
              }

              startSession(uid).then((token) => {
                let response_data = {
                  uid: uid,
                  email: email,
                  token: token,
                };
                // Argument of type '{ p: { password: any; email: string; lti_user_id: any; lti_user_image: any;
                // lti_context_id: any; tool_consumer_instance_guid?: any; afterJoinRedirectUrl: any; }; }' is not assignable to parameter of type
                // '{ cookies: { [x: string]: any; }; }'.
                //  Property 'cookies' is missing in type '{ p: { password: any; email: string; lti_user_id: any;
                // lti_user_image: any; lti_context_id: any; tool_consumer_instance_guid?: any; afterJoinRedirectUrl: any; }; }' but required in type
                // '{ cookies: { [x: string]: any; }; }'.ts(2345)
                // @ts-ignore
                addCookies(req, res, token, uid)
                  .then(function () {
                    res.json(response_data);
                  })
                  .catch(function (err: any) {
                    fail(res, 500, "polis_err_adding_cookies", err);
                  });
              });
            }
          ); // compare
        }
      ); // pwhash query
    }
  ); // users query
} // /api/v3/auth/login

function handle_POST_joinWithInvite(
  req: {
    p: {
      answers: any;
      uid?: any;
      suzinvite: any;
      permanentCookieToken: any;
      zid: any;
      referrer: any;
      parent_url: any;
    };
  },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: { pid: any; uid?: any }): void; new (): any };
    };
  }
) {
  // if they're already in the conv
  //     this shouldn't get called
  // else
  //     not in conv.
  //     need to join
  //     has their permanentCookieToken already joined?
  //         do they have an email attached?
  //              hmm weird.. what to do?
  //         else
  //              force them to create a full account
  //     else
  //         let them join without forcing a sign in (assuming conversation allows that)

  return (
    joinWithZidOrSuzinvite({
      answers: req.p.answers,
      existingAuth: !!req.p.uid,
      suzinvite: req.p.suzinvite,
      permanentCookieToken: req.p.permanentCookieToken,
      uid: req.p.uid,
      zid: req.p.zid, // since the zid is looked up using the conversation_id, it's safe to use zid as an invite token. TODO huh?
      referrer: req.p.referrer,
      parent_url: req.p.parent_url,
    })
      // @ts-ignore
      .then(function (o: { uid?: any; existingAuth: string }) {
        let uid = o.uid;
        logger.info(
          "startSessionAndAddCookies " + uid + " existing " + o.existingAuth
        );
        // TODO check for possible security implications
        if (!o.existingAuth) {
          return startSessionAndAddCookies(req, res, uid).then(function () {
            return o;
          });
        }
        return Promise.resolve(o);
      })
      //       No overload matches this call.
      // Overload 1 of 2, '(onFulfill?: ((value: unknown) => Resolvable<{ permanentCookieToken: any; zid: any; }>) | undefined,
      //  onReject ?: ((error: any) => Resolvable<{ permanentCookieToken: any; zid: any; }>) | undefined): Bluebird <...> ', gave the following error.
      //   Argument of type '(o: { permanentCookieToken: any; zid: any; }) => { permanentCookieToken: any; zid: any; } |
      // Promise < { permanentCookieToken: any; zid: any; } > ' is not assignable to parameter of type '(value: unknown) => Resolvable < { permanentCookieToken: any; zid: any; } > '.
      //     Types of parameters 'o' and 'value' are incompatible.
      //       Type 'unknown' is not assignable to type '{ permanentCookieToken: any; zid: any; }'.
      // Overload 2 of 2, '(onfulfilled?: ((value: unknown) => Resolvable<{ permanentCookieToken: any; zid: any; }>) |
      //  null | undefined, onrejected ?: ((reason: any) => PromiseLike<never>) | null | undefined): Bluebird <...> ', gave the following error.
      //   Argument of type '(o: { permanentCookieToken: any; zid: any; }) => { permanentCookieToken: any; zid: any; } |
      // Promise < { permanentCookieToken: any; zid: any; } > ' is not assignable to parameter of type '(value: unknown) => Resolvable < { permanentCookieToken: any; zid: any; } > '.
      //     Types of parameters 'o' and 'value' are incompatible.
      //     Type 'unknown' is not assignable to type '{ permanentCookieToken: any; zid: any; }'.ts(2769)
      // @ts-ignore
      .then(function (o: { permanentCookieToken: any; zid: any }) {
        logger.info("permanentCookieToken", o.permanentCookieToken);
        if (o.permanentCookieToken) {
          return recordPermanentCookieZidJoin(
            o.permanentCookieToken,
            o.zid
          ).then(
            function () {
              return o;
            },
            function () {
              return o;
            }
          );
        } else {
          return o;
        }
      })
      //       No overload matches this call.
      // Overload 1 of 2, '(onFulfill?: ((value: unknown) => Resolvable<void>) | undefined, onReject?: ((error: any) => Resolvable<void>) | undefined): Bluebird<void>', gave the following error.
      //   Argument of type '(o: { pid: any; }) => void' is not assignable to parameter of type '(value: unknown) => Resolvable<void>'.
      //     Types of parameters 'o' and 'value' are incompatible.
      //       Type 'unknown' is not assignable to type '{ pid: any; }'.
      // Overload 2 of 2, '(onfulfilled?: ((value: unknown) => Resolvable<void>) | null | undefined, onrejected?: ((reason: any) => PromiseLike<never>) | null | undefined): Bluebird<void>', gave the following error.
      //   Argument of type '(o: { pid: any; }) => void' is not assignable to parameter of type '(value: unknown) => Resolvable<void>'.
      //     Types of parameters 'o' and 'value' are incompatible.
      //     Type 'unknown' is not assignable to type '{ pid: any; }'.ts(2769)
      // @ts-ignore
      .then(function (o: { pid: any }) {
        let pid = o.pid;
        res.status(200).json({
          pid: pid,
          uid: req.p.uid,
        });
      })
      .catch(function (err: { message: string }) {
        if (
          err &&
          err.message &&
          err.message.match(/polis_err_need_full_user/)
        ) {
          fail(res, 403, err.message, err);
        } else if (err && err.message) {
          fail(res, 500, err.message, err);
        } else if (err) {
          fail(res, 500, "polis_err_joinWithZidOrSuzinvite", err);
        } else {
          fail(res, 500, "polis_err_joinWithZidOrSuzinvite");
        }
      })
  );
}
// Test for deadlock condition
// _.times(2, function() {
// setInterval(function() {
//         joinWithZidOrSuzinvite({
//             answers: [],
//             existingAuth: false,
//             zid: 11580,
//             // uid: req.p.uid,
//         }).then(function() {
//         }).catch(function(err) {
//         });

// }, 10);
// });
function joinWithZidOrSuzinvite(o: {
  answers: any;
  existingAuth: boolean;
  suzinvite: any;
  permanentCookieToken: any;
  uid?: any;
  zid: any; // since the zid is looked up using the conversation_id, it's safe to use zid as an invite token. TODO huh?
  referrer: any;
  parent_url: any;
}) {
  return (
    Promise.resolve(o)
      .then(function (o: { suzinvite: any; zid: any }) {
        if (o.suzinvite) {
          return getSUZinviteInfo(o.suzinvite).then(function (
            suzinviteInfo: any
          ) {
            return Object.assign(o, suzinviteInfo);
          });
        } else if (o.zid) {
          return o;
        } else {
          throw new Error("polis_err_missing_invite");
        }
      })
      .then(function (o: { zid: any; conv: any }) {
        logger.info("joinWithZidOrSuzinvite convinfo begin");
        return getConversationInfo(o.zid).then(function (conv: any) {
          logger.info("joinWithZidOrSuzinvite convinfo done");
          o.conv = conv;
          return o;
        });
      })
      .then(function (o: any) {
        return o;
      })
      //       No overload matches this call.
      // Overload 1 of 2, '(onFulfill?: ((value: unknown) => any) | undefined, onReject?: ((error: any) => any) | undefined): Bluebird<any>', gave the following error.
      //   Argument of type '(o: { uid?: any; user: any; }) => any' is not assignable to parameter of type '(value: unknown) => any'.
      //     Types of parameters 'o' and 'value' are incompatible.
      //       Type 'unknown' is not assignable to type '{ uid?: any; user: any; }'.
      // Overload 2 of 2, '(onfulfilled?: ((value: unknown) => any) | null | undefined, onrejected?: ((reason: any) => PromiseLike<never>) | null | undefined): Bluebird<any>', gave the following error.
      //   Argument of type '(o: { uid?: any; user: any; }) => any' is not assignable to parameter of type '(value: unknown) => any'.
      //     Types of parameters 'o' and 'value' are incompatible.
      //     Type 'unknown' is not assignable to type '{ uid?: any; user: any; }'.ts(2769)
      // @ts-ignore
      .then(function (o: { uid?: any; user: any }) {
        logger.info("joinWithZidOrSuzinvite userinfo begin");
        if (!o.uid) {
          logger.info("joinWithZidOrSuzinvite userinfo no uid");
          return o;
        }
        return getUserInfoForUid2(o.uid).then(function (user: any) {
          logger.info("joinWithZidOrSuzinvite userinfo done");
          o.user = user;
          return o;
        });
      })
      // Commenting out for now until we have proper workflow for user.
      // .then(function(o) {
      //   logger.info("joinWithZidOrSuzinvite check email");
      // if (o.conv.owner_sees_participation_stats) {
      //   // User stats can be provided either by having the users sign in with polis
      //   // or by having them join via suurls.
      //   if (!(o.user && o.user.email) && !o.suzinvite) { // may want to inspect the contenst of the suzinvite info object instead of just the suzinvite
      //     throw new Error("polis_err_need_full_user_for_zid_" + o.conv.zid + "_and_uid_" + (o.user&&o.user.uid));
      //   }
      // }
      // return o;
      // })
      // @ts-ignore
      .then(function (o: { uid?: any }) {
        if (o.uid) {
          return o;
        } else {
          return createDummyUser().then(function (uid?: any) {
            return Object.assign(o, {
              uid: uid,
            });
          });
        }
      })
      // No overload matches this call.
      // Overload 1 of 2, '(onFulfill?: ((value: unknown) => any) | undefined, onReject?: ((error: any) => any) | undefined): Bluebird<any>', gave the following error.
      //   Argument of type '(o: { zid: any; answers: any; }) => any' is not assignable to parameter of type '(value: unknown) => any'.
      //     Types of parameters 'o' and 'value' are incompatible.
      //       Type 'unknown' is not assignable to type '{ zid: any; answers: any; }'.
      // Overload 2 of 2, '(onfulfilled?: ((value: unknown) => any) | null | undefined, onrejected?: ((reason: any) => PromiseLike<never>) | null | undefined): Bluebird<any>', gave the following error.
      //   Argument of type '(o: { zid: any; answers: any; }) => any' is not assignable to parameter of type '(value: unknown) => any'.
      //     Types of parameters 'o' and 'value' are incompatible.
      //     Type 'unknown' is not assignable to type '{ zid: any; answers: any; }'.ts(2769)
      // @ts-ignore
      .then(function (o: { zid: any; answers: any }) {
        return userHasAnsweredZeQuestions(o.zid, o.answers).then(function () {
          // looks good, pass through
          return o;
        });
      })
      //       No overload matches this call.
      // Overload 1 of 2, '(onFulfill?: ((value: unknown) => any) | undefined, onReject?: ((error: any) => any) | undefined): Bluebird<any>', gave the following error.
      //   Argument of type '(o: { referrer: any; parent_url: any; zid: any; uid?: any; answers: any; }) => any' is not assignable to parameter of type '(value: unknown) => any'.
      //     Types of parameters 'o' and 'value' are incompatible.
      //       Type 'unknown' is not assignable to type '{ referrer: any; parent_url: any; zid: any; uid?: any; answers: any; }'.
      // Overload 2 of 2, '(onfulfilled?: ((value: unknown) => any) | null | undefined, onrejected?: ((reason: any) => PromiseLike<never>) | null | undefined): Bluebird<any>', gave the following error.
      //   Argument of type '(o: { referrer: any; parent_url: any; zid: any; uid?: any; answers: any; }) => any' is not assignable to parameter of type '(value: unknown) => any'.
      //     Types of parameters 'o' and 'value' are incompatible.
      //     Type 'unknown' is not assignable to type '{ referrer: any; parent_url: any; zid: any; uid?: any; answers: any; }'.ts(2769)
      // @ts-ignore
      .then(function (o: {
        referrer: any;
        parent_url: any;
        zid: any;
        uid?: any;
        answers: any;
      }) {
        let info: ParticipantInfo = {};
        if (o.referrer) {
          info.referrer = o.referrer;
        }
        if (o.parent_url) {
          info.parent_url = o.parent_url;
        }
        // TODO_REFERRER add info as third arg
        return joinConversation(o.zid, o.uid, info, o.answers).then(function (
          ptpt: any
        ) {
          return Object.assign(o, ptpt);
        });
      })
      //       No overload matches this call.
      // Overload 1 of 2, '(onFulfill?: ((value: unknown) => Resolvable<{ xid: any; conv: { org_id: any; use_xid_whitelist: any; owner: any; };
      // uid?: any; } | undefined>) | undefined, onReject?: ((error: any) => Resolvable<{ xid: any; conv: { ...; }; uid?: any; } | undefined>) | undefined): Bluebird<...>', gave the following error.
      //   Argument of type '(o: { xid: any; conv: { org_id: any; use_xid_whitelist: any; owner: any; }; uid?: any; }) =>
      // { xid: any; conv: { org_id: any; use_xid_whitelist: any; owner: any; }; uid ?: any; } | Promise < { xid: any; conv: { org_id: any; use_xid_whitelist: any; owner: any; }; uid?: any; } |
      // undefined > ' is not assignable to parameter of type '(value: unknown) => Resolvable < { xid: any; conv: { org_id: any; use_xid_whitelist: any; owner: any; }; uid?: any; } | undefined > '.
      //     Types of parameters 'o' and 'value' are incompatible.
      //       Type 'unknown' is not assignable to type '{ xid: any; conv: { org_id: any; use_xid_whitelist: any; owner: any; }; uid?: any; }'.
      // Overload 2 of 2, '(onfulfilled?: ((value: unknown) => Resolvable<{ xid: any; conv: { org_id: any; use_xid_whitelist: any; owner: any; }; uid?: any; }
      // | undefined >) | null | undefined, onrejected ?: ((reason: any) => PromiseLike<never>) | null | undefined): Bluebird <...> ', gave the following error.
      //   Argument of type '(o: { xid: any; conv: { org_id: any; use_xid_whitelist: any; owner: any; }; uid?: any; }) =>
      // { xid: any; conv: { org_id: any; use_xid_whitelist: any; owner: any; }; uid ?: any; } | Promise < { xid: any; conv: { org_id: any; use_xid_whitelist: any; owner: any; }; uid?: any; }
      // | undefined > ' is not assignable to parameter of type '(value: unknown) => Resolvable < { xid: any; conv: { org_id: any; use_xid_whitelist: any; owner: any; }; uid?: any; } | undefined > '.
      //     Types of parameters 'o' and 'value' are incompatible.
      //       Type 'unknown' is not assignable to type '{ xid: any; conv: { org_id: any; use_xid_whitelist: any; owner: any; }; uid?: any; }'.ts(2769)
      // @ts-ignore
      .then(function (o: {
        xid: any;
        conv: { org_id: any; use_xid_whitelist: any; owner: any };
        uid?: any;
      }) {
        if (o.xid) {
          // used for suzinvite case

          return xidExists(o.xid, o.conv.org_id, o.uid).then(function (
            exists: any
          ) {
            if (exists) {
              // skip creating the entry (workaround for posgres's lack of upsert)
              return o;
            }
            var shouldCreateXidEntryPromise = o.conv.use_xid_whitelist
              ? isXidWhitelisted(o.conv.owner, o.xid)
              : Promise.resolve(true);
            shouldCreateXidEntryPromise.then((should: any) => {
              if (should) {
                return createXidEntry(o.xid, o.conv.org_id, o.uid).then(
                  function () {
                    return o;
                  }
                );
              } else {
                throw new Error("polis_err_xid_not_whitelisted");
              }
            });
          });
        } else {
          return o;
        }
      })
      //       No overload matches this call.
      // Overload 1 of 2, '(onFulfill?: ((value: unknown) => Resolvable<{ suzinvite: any; }>) | undefined, onReject?: ((error: any) => Resolvable<{ suzinvite: any; }>) | undefined): Bluebird<{ suzinvite: any; }>', gave the following error.
      //   Argument of type '(o: { suzinvite: any; }) => { suzinvite: any; } | Bluebird<{ suzinvite: any; }>' is not assignable to parameter of type '(value: unknown) => Resolvable<{ suzinvite: any; }>'.
      //     Types of parameters 'o' and 'value' are incompatible.
      //       Type 'unknown' is not assignable to type '{ suzinvite: any; }'.
      // Overload 2 of 2, '(onfulfilled?: ((value: unknown) => Resolvable<{ suzinvite: any; }>) | null | undefined, onrejected?: ((reason: any) => PromiseLike<never>) | null | undefined): Bluebird<...>', gave the following error.
      //   Argument of type '(o: { suzinvite: any; }) => { suzinvite: any; } | Bluebird<{ suzinvite: any; }>' is not assignable to parameter of type '(value: unknown) => Resolvable<{ suzinvite: any; }>'.
      //     Types of parameters 'o' and 'value' are incompatible.
      //     Type 'unknown' is not assignable to type '{ suzinvite: any; }'.ts(2769)
      // @ts-ignore
      .then(function (o: { suzinvite: any }) {
        if (o.suzinvite) {
          return deleteSuzinvite(o.suzinvite).then(function () {
            return o;
          });
        } else {
          return o;
        }
      })
  );
}
async function startSessionAndAddCookies(req: any, res: any, uid?: any) {
  let token;
  try {
    token = await startSession(uid)
  } catch (err) {
    throw new Error("polis_err_reg_failed_to_start_session");
  }

  await addCookies(req, res, token, uid);
}

function getFirstForPid(votes: string | any[]) {
  let seen = {};
  let len = votes.length;
  let firstVotes = [];
  for (var i = 0; i < len; i++) {
    let vote = votes[i];
    // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
    // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
    // @ts-ignore
    if (!seen[vote.pid]) {
      firstVotes.push(vote);
      // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
      // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
      // @ts-ignore
      seen[vote.pid] = true;
    }
  }
  return firstVotes;
}
function isParentDomainWhitelisted(
  domain: string,
  zid: any,
  isWithinIframe: any,
  domain_whitelist_override_key: any
) {
  return pgQueryP_readOnly(
    "select * from site_domain_whitelist where site_id = " +
      "(select site_id from users where uid = " +
      "(select owner from conversations where zid = ($1)));",
    [zid]
  ).then(function (rows: string | any[]) {
    logger.debug("isParentDomainWhitelisted", {
      domain,
      zid,
      isWithinIframe,
    });
    if (!rows || !rows.length || !rows[0].domain_whitelist.length) {
      // there is no whitelist, so any domain is ok.
      logger.debug("isParentDomainWhitelisted : no whitelist");
      return true;
    }
    let whitelist = rows[0].domain_whitelist;
    let wdomains = whitelist.split(",");
    if (!isWithinIframe && wdomains.indexOf("*.pol.is") >= 0) {
      // if pol.is is in the whitelist, then it's ok to show the conversation outside of an iframe.
      logger.debug("isParentDomainWhitelisted : *.pol.is");
      return true;
    }
    if (
      domain_whitelist_override_key &&
      rows[0].domain_whitelist_override_key === domain_whitelist_override_key
    ) {
      return true;
    }
    let ok = false;
    for (var i = 0; i < wdomains.length; i++) {
      let w = wdomains[i];
      let wParts = w.split(".");

      // example: domain might be blogs.nytimes.com, and whitelist entry might be *.nytimes.com, and that should be a match
      let parts = domain.split(".");

      if (wParts.length && wParts[0] === "*") {
        // wild card case
        // check for a match on each part following the '*'
        let bad = false;

        wParts = wParts.reverse();
        parts = parts.reverse();
        for (var p = 0; p < wParts.length - 1; p++) {
          if (wParts[p] !== parts[p]) {
            bad = true;
            break;
          }
        }
        ok = !bad;
      } else {
        // no wild card
        let bad2 = false;
        if (wParts.length !== parts.length) {
          bad2 = true;
        }
        // check for a match on each part
        for (var p2 = 0; p2 < wParts.length; p2++) {
          if (wParts[p2] !== parts[p2]) {
            bad2 = true;
            break;
          }
        }
        ok = !bad2;
      }

      if (ok) {
        break;
      }
    }
    logger.debug("isParentDomainWhitelisted : " + ok);
    return ok;
  });
}
function denyIfNotFromWhitelistedDomain(
  req: {
    headers?: { referrer: string };
    p: { zid: any; domain_whitelist_override_key: any };
  },
  res: { send: (arg0: number, arg1: string) => void },
  next: (arg0?: string) => void
) {
  let isWithinIframe =
    req.headers &&
    req.headers.referrer &&
    req.headers.referrer.includes("parent_url");
  // res.status(403);
  // next("polis_err_domain");
  // return;

  let ref = req?.headers?.referrer;
  let refParts: string[] = [];
  let resultRef = "";
  if (isWithinIframe) {
    if (ref) {
      const decodedRefString = decodeURIComponent(
        ref.replace(/.*parent_url=/, "").replace(/&.*/, "")
      );
      if (decodedRefString && decodedRefString.length)
        refParts = decodedRefString.split("/");
      resultRef = (refParts && refParts.length >= 3 && refParts[2]) || "";
    }
  } else {
    if (ref && ref.length) refParts = ref.split("/");
    if (refParts && refParts.length >= 3) resultRef = refParts[2] || "";
  }
  // let path = req.path;
  // path = path && path.split('/');
  // let conversation_id = path && path.length >= 2 && path[1];
  let zid = req.p.zid;

  isParentDomainWhitelisted(
    resultRef,
    zid,
    isWithinIframe,
    req.p.domain_whitelist_override_key
  )
    .then(function (isOk: any) {
      if (isOk) {
        next();
      } else {
        res.send(403, "polis_err_domain");
        next("polis_err_domain");
      }
    })
    .catch(function (err: any) {
      logger.error("error in isParentDomainWhitelisted", err);
      res.send(403, "polis_err_domain");
      next("polis_err_domain_misc");
    });
}

function setDomainWhitelist(uid?: any, newWhitelist?: any) {
  // TODO_UPSERT
  return pgQueryP(
    "select * from site_domain_whitelist where site_id = (select site_id from users where uid = ($1));",
    [uid]
  ).then(function (rows: string | any[]) {
    if (!rows || !rows.length) {
      return pgQueryP(
        "insert into site_domain_whitelist (site_id, domain_whitelist) values ((select site_id from users where uid = ($1)), $2);",
        [uid, newWhitelist]
      );
    } else {
      return pgQueryP(
        "update site_domain_whitelist set domain_whitelist = ($2) where site_id = (select site_id from users where uid = ($1));",
        [uid, newWhitelist]
      );
    }
  });
}

function getDomainWhitelist(uid?: any) {
  return pgQueryP(
    "select * from site_domain_whitelist where site_id = (select site_id from users where uid = ($1));",
    [uid]
  ).then(function (rows: string | any[]) {
    if (!rows || !rows.length) {
      return "";
    }
    return rows[0].domain_whitelist;
  });
}
function handle_GET_domainWhitelist(
  req: { p: { uid?: any } },
  res: { json: (arg0: { domain_whitelist: any }) => void }
) {
  getDomainWhitelist(req.p.uid)
    .then(function (whitelist: any) {
      res.json({
        domain_whitelist: whitelist,
      });
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_get_domainWhitelist_misc", err);
    });
}
function handle_POST_domainWhitelist(
  req: { p: { uid?: any; domain_whitelist: any } },
  res: { json: (arg0: { domain_whitelist: any }) => void }
) {
  setDomainWhitelist(req.p.uid, req.p.domain_whitelist)
    .then(function () {
      res.json({
        domain_whitelist: req.p.domain_whitelist,
      });
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_post_domainWhitelist_misc", err);
    });
}
function handle_GET_conversationStats(
  req: { p: { zid: any; uid?: any; until: any; rid: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: {
        (arg0: {
          voteTimes: any;
          firstVoteTimes: any[];
          commentTimes: any;
          firstCommentTimes: any[];
          // viewTimes: viewTimes,
          votesHistogram: any;
          burstHistogram: any[];
        }): void;
        new (): any;
      };
    };
  }
) {
  let zid = req.p.zid;
  let uid = req.p.uid;
  let until = req.p.until;

  let hasPermission = req.p.rid
    ? Promise.resolve(!!req.p.rid)
    : isModerator(zid, uid);

  hasPermission
    .then(function (ok: any) {
      if (!ok) {
        fail(
          res,
          403,
          "polis_err_conversationStats_need_report_id_or_moderation_permission"
        );
        return;
      }

      let args = [zid];

      let q0 = until
        ? "select created, pid, mod from comments where zid = ($1) and created < ($2) order by created;"
        : "select created, pid, mod from comments where zid = ($1) order by created;";

      let q1 = until
        ? "select created, pid from votes where zid = ($1) and created < ($2) order by created;"
        : "select created, pid from votes where zid = ($1) order by created;";

      if (until) {
        args.push(until);
      }

      return Promise.all([
        pgQueryP_readOnly(q0, args),
        pgQueryP_readOnly(q1, args),
        // pgQueryP_readOnly("select created from participants where zid = ($1) order by created;", [zid]),
      ]).then(function (a: any[]) {
        function castTimestamp(o: { created: number }) {
          o.created = Number(o.created);
          return o;
        }
        let comments = _.map(a[0], castTimestamp);
        let votes = _.map(a[1], castTimestamp);
        // let uniqueHits = _.map(a[2], castTimestamp); // participants table
        // let votesHistogram = a[2];
        // let socialUsers = _.map(a[4], castTimestamp);

        let votesGroupedByPid = _.groupBy(votes, "pid");
        let votesHistogramObj = {};
        _.each(
          votesGroupedByPid,
          function (votesByParticipant: string | any[]) {
            // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
            // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
            // @ts-ignore
            votesHistogramObj[votesByParticipant.length] =
              // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
              // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
              // @ts-ignore
              votesHistogramObj[votesByParticipant.length] + 1 || 1;
          }
        );
        let votesHistogram: { n_votes: any; n_ptpts: any }[] = [];
        _.each(votesHistogramObj, function (ptptCount: any, voteCount: any) {
          votesHistogram.push({
            n_votes: voteCount,
            n_ptpts: ptptCount,
          });
        });
        votesHistogram.sort(function (a, b) {
          return a.n_ptpts - b.n_ptpts;
        });

        let burstsForPid = {};
        let interBurstGap = 10 * 60 * 1000; // a 10 minute gap between votes counts as a gap between bursts
        _.each(
          votesGroupedByPid,
          function (
            votesByParticipant: string | any[],
            pid: string | number
          ) {
            // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
            // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
            // @ts-ignore
            burstsForPid[pid] = 1;
            let prevCreated = votesByParticipant.length
              ? votesByParticipant[0]
              : 0;
            for (var v = 1; v < votesByParticipant.length; v++) {
              let vote = votesByParticipant[v];
              if (interBurstGap + prevCreated < vote.created) {
                // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
                // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
                // @ts-ignore
                burstsForPid[pid] += 1;
              }
              prevCreated = vote.created;
            }
          }
        );
        let burstHistogramObj = {};
        //         Argument of type '(bursts: string | number, pid: any) => void' is not assignable to parameter of type 'CollectionIterator<unknown, void, {}>'.
        // Types of parameters 'bursts' and 'element' are incompatible.
        //   Type 'unknown' is not assignable to type 'string | number'.
        //           Type 'unknown' is not assignable to type 'number'.ts(2345)
        // @ts-ignore
        _.each(burstsForPid, function (bursts: string | number) {
          // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
          // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
          // @ts-ignore
          burstHistogramObj[bursts] = burstHistogramObj[bursts] + 1 || 1;
        });
        let burstHistogram: { n_ptpts: any; n_bursts: number }[] = [];
        _.each(burstHistogramObj, function (ptptCount: any, burstCount: any) {
          burstHistogram.push({
            n_ptpts: ptptCount,
            n_bursts: Number(burstCount),
          });
        });
        burstHistogram.sort(function (a, b) {
          return a.n_bursts - b.n_bursts;
        });

        let actualParticipants = getFirstForPid(votes); // since an agree vote is submitted for each comment's author, this includes people who only wrote a comment, but didn't explicitly vote.
        actualParticipants = _.pluck(actualParticipants, "created");
        let commenters = getFirstForPid(comments);
        commenters = _.pluck(commenters, "created");

        let totalComments = _.pluck(comments, "created");
        let totalVotes = _.pluck(votes, "created");
        // let viewTimes = _.pluck(uniqueHits, "created");
        // let totalSocialUsers = _.pluck(socialUsers, "created");

        votesHistogram = _.map(
          votesHistogram,
          function (x: { n_votes: any; n_ptpts: any }) {
            return {
              n_votes: Number(x.n_votes),
              n_ptpts: Number(x.n_ptpts),
            };
          }
        );

        res.status(200).json({
          voteTimes: totalVotes,
          firstVoteTimes: actualParticipants,
          commentTimes: totalComments,
          firstCommentTimes: commenters,
          // viewTimes: viewTimes,
          votesHistogram: votesHistogram,
          burstHistogram: burstHistogram,
          // socialUsers: totalSocialUsers,
        });
      });
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_conversationStats_misc", err);
    });
}
function handle_GET_snapshot(
  req: { p: { uid?: any; zid: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: {
        (arg0: { zid: any; zinvite: any; url: string }): void;
        new (): any;
      };
    };
  }
) {
  let uid = req.p.uid;
  let zid = req.p.zid;

  if (true) {
    throw new Error(
      "TODO Needs to clone participants_extended and any other new tables as well."
    );
  }
  if (isPolisDev(uid)) {
    // is polis developer
  } else {
    fail(res, 403, "polis_err_permissions");
    return;
  }

  pgQuery(
    "insert into conversations (topic, description, survey_caption, postsurvey, postsurvey_limit, postsurvey_submissions, postsurvey_redirect, link_url, owner, modified, created, participant_count) " +
      "(select '(SNAPSHOT) ' || topic, description, survey_caption, postsurvey, postsurvey_limit, postsurvey_submissions, postsurvey_redirect, link_url, $2, now_as_millis(), created, participant_count from conversations where zid = $1) returning *;",
    [zid, uid],
    function (err: any, result: { rows: any[] }) {
      if (err) {
        fail(res, 500, "polis_err_cloning_conversation", err);
        return;
      }
      let conv = result.rows[0];

      let newZid = conv.zid;
      return pgQueryP(
        "insert into participants (pid, zid, uid, created, mod, subscribed) " +
          "select pid, ($2), uid, created, mod, 0 from participants where zid = ($1);",
        [zid, newZid]
      )
        .then(function () {
          return pgQueryP(
            "insert into comments (pid, tid, zid, txt, velocity, mod, uid, active, lang, lang_confidence, created) " +
              "select pid, tid, ($2), txt, velocity, mod, uid, active, lang, lang_confidence, created from comments where zid = ($1);",
            [zid, newZid]
          ).then(function () {
            return pgQueryP("select * from votes where zid = ($1);", [
              zid,
              //               Argument of type '(votes: any[]) => Promise<void>' is not assignable to parameter of type '(value: unknown) => void | PromiseLike<void>'.
              // Types of parameters 'votes' and 'value' are incompatible.
              //                 Type 'unknown' is not assignable to type 'any[]'.ts(2345)
              // @ts-ignore
            ]).then((votes: any[]) => {
              // insert votes one at a time.
              return Promise.all(
                votes.map(function (v: {
                  pid: any;
                  tid: any;
                  vote: any;
                  created: any;
                }) {
                  let q =
                    "insert into votes (zid, pid, tid, vote, created) values ($1, $2, $3, $4, $5);";
                  return pgQueryP(q, [
                    newZid,
                    v.pid,
                    v.tid,
                    v.vote,
                    v.created,
                  ]);
                })
              ).then(function () {
                return generateAndRegisterZinvite(newZid, true).then(
                  function (zinvite: string) {
                    res.status(200).json({
                      zid: newZid,
                      zinvite: zinvite,
                      url: getServerNameWithProtocol(req) + "/" + zinvite,
                    });
                  }
                );
              });
            });
          });
        })
        .catch(function (err: any) {
          fail(res, 500, "polis_err_cloning_conversation_misc", err);
        });
    }
  );
}

function handle_POST_auth_new(req: any, res: any) {
  CreateUser.createUser(req, res);
} // end /api/v3/auth/new

function handle_POST_tutorial(
  req: { p: { uid?: any; step: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: {}): void; new (): any };
    };
  }
) {
  let uid = req.p.uid;
  let step = req.p.step;
  pgQueryP("update users set tut = ($1) where uid = ($2);", [step, uid])
    .then(function () {
      res.status(200).json({});
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_saving_tutorial_state", err);
    });
}

function handle_GET_users(
  req: { p: { uid?: any; errIfNoAuth: any; xid: any; owner_uid?: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: any): void; new (): any };
    };
  }
) {
  let uid = req.p.uid;

  if (req.p.errIfNoAuth && !uid) {
    fail(res, 500, "polis_err_getting_user_info", new Error());
    return;
  }

  getUser(uid, null, req.p.xid, req.p.owner_uid)
    .then(
      function (user: any) {
        res.status(200).json(user);
      },
      function (err: any) {
        fail(res, 500, "polis_err_getting_user_info2", err);
      }
    )
    .catch(function (err: any) {
      fail(res, 500, "polis_err_getting_user_info", err);
    });
}

const getUser = User.getUser;
const getComments = Comment.getComments;
const getNumberOfCommentsRemaining = Comment.getNumberOfCommentsRemaining;

function handle_GET_participation(
  req: { p: { zid: any; uid?: any; strict: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: {}): void; new (): any };
    };
  }
) {
  let zid = req.p.zid;
  let uid = req.p.uid;
  let strict = req.p.strict;
  isOwner(zid, uid)
    .then(function (ok: any) {
      if (!ok) {
        fail(res, 403, "polis_err_get_participation_auth");
        return;
      }

      return Promise.all([
        pgQueryP_readOnly(
          "select pid, count(*) from votes where zid = ($1) group by pid;",
          [zid]
        ),
        pgQueryP_readOnly(
          "select pid, count(*) from comments where zid = ($1) group by pid;",
          [zid]
        ),
        getXids(zid), //pgQueryP_readOnly("select pid, xid from xids inner join (select * from participants where zid = ($1)) as p on xids.uid = p.uid;", [zid]),
      ]).then(function (o: any[]) {
        let voteCountRows = o[0];
        let commentCountRows = o[1];
        let pidXidRows = o[2];
        let i, r;

        if (strict && !pidXidRows.length) {
          fail(
            res,
            409,
            "polis_err_get_participation_missing_xids This conversation has no xids for its participants."
          );
          return;
        }

        // @ts-ignore
        let result = new DD(function () {
          return {
            votes: 0,
            comments: 0,
          };
        });

        // Count votes
        for (i = 0; i < voteCountRows.length; i++) {
          r = voteCountRows[i];
          result.g(r.pid).votes = Number(r.count);
        }
        // Count comments
        for (i = 0; i < commentCountRows.length; i++) {
          r = commentCountRows[i];
          result.g(r.pid).comments = Number(r.count);
        }

        // convert from DD to POJO
        result = result.m;

        if (pidXidRows && pidXidRows.length) {
          // Convert from {pid -> foo} to {xid -> foo}
          let pidToXid = {};
          for (i = 0; i < pidXidRows.length; i++) {
            // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
            // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
            // @ts-ignore
            pidToXid[pidXidRows[i].pid] = pidXidRows[i].xid;
          }
          let xidBasedResult = {};
          let size = 0;
          _.each(result, function (val: any, key: string | number) {
            // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
            // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
            // @ts-ignore
            xidBasedResult[pidToXid[key]] = val;
            size += 1;
          });

          if (
            strict &&
            (commentCountRows.length || voteCountRows.length) &&
            size > 0
          ) {
            fail(
              res,
              409,
              "polis_err_get_participation_missing_xids This conversation is missing xids for some of its participants."
            );
            return;
          }
          res.status(200).json(xidBasedResult);
        } else {
          res.status(200).json(result);
        }
      });
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_get_participation_misc", err);
    });
}
function getAgeRange(demo: Demo) {
  var currentYear = new Date().getUTCFullYear();
  var birthYear = demo.ms_birth_year_estimate_fb;
  if (_.isNull(birthYear) || _.isUndefined(birthYear) || _.isNaN(birthYear)) {
    return "?";
  }
  var age = currentYear - birthYear;
  if (age < 12) {
    return "0-11";
  } else if (age < 18) {
    return "12-17";
  } else if (age < 25) {
    return "18-24";
  } else if (age < 35) {
    return "25-34";
  } else if (age < 45) {
    return "35-44";
  } else if (age < 55) {
    return "45-54";
  } else if (age < 65) {
    return "55-64";
  } else {
    return "65+";
  }
}

function getDemographicsForVotersOnComments(zid: any, comments: any[]) {
  function isAgree(v: { vote: any }) {
    return v.vote === polisTypes.reactions.pull;
  }
  function isDisgree(v: { vote: any }) {
    return v.vote === polisTypes.reactions.push;
  }
  function isPass(v: { vote: any }) {
    return v.vote === polisTypes.reactions.pass;
  }

  function isGenderMale(demo: { gender: number }) {
    return demo.gender === 0;
  }
  function isGenderFemale(demo: { gender: number }) {
    return demo.gender === 1;
  }
  function isGenderUnknown(demo: { gender: any }) {
    var gender = demo.gender;
    return gender !== 0 && gender !== 1;
  }

  return Promise.all([
    pgQueryP(
      "select pid,tid,vote from votes_latest_unique where zid = ($1);",
      [zid]
    ),
    pgQueryP(
      "select p.pid, d.* from participants p left join demographic_data d on p.uid = d.uid where p.zid = ($1);",
      [zid]
    ),
  ]).then((a: any[]) => {
    var votes = a[0];
    var demo = a[1];
    demo = demo.map((d: Demo) => {
      return {
        pid: d.pid,
        // TODO: should we get rid of this?
        gender: 2,
        ageRange: getAgeRange(d),
      };
    });
    var demoByPid = _.indexBy(demo, "pid");

    votes = votes.map((v: { pid: string | number }) => {
      return _.extend(v, demoByPid[v.pid]);
    });

    var votesByTid = _.groupBy(votes, "tid");

    // TODO maybe we should actually look at gender, then a/d/p %
    // TODO maybe we should actually look at each age range, then a/d/p %
    // that will be more natrual in cases of unequal representation

    return comments.map(
      (c: {
        tid: string | number;
        demographics: {
          gender: {
            m: { agree: any; disagree: any; pass: any };
            f: { agree: any; disagree: any; pass: any };
            "?": { agree: any; disagree: any; pass: any };
          };
          // TODO return all age ranges even if zero.
          age: any;
        };
      }) => {
        var votesForThisComment = votesByTid[c.tid];

        if (!votesForThisComment || !votesForThisComment.length) {
          return c;
        }

        var agrees = votesForThisComment.filter(isAgree);
        var disagrees = votesForThisComment.filter(isDisgree);
        var passes = votesForThisComment.filter(isPass);

        var votesByAgeRange = _.groupBy(votesForThisComment, "ageRange");

        c.demographics = {
          gender: {
            m: {
              agree: agrees.filter(isGenderMale).length,
              disagree: disagrees.filter(isGenderMale).length,
              pass: passes.filter(isGenderMale).length,
            },
            f: {
              agree: agrees.filter(isGenderFemale).length,
              disagree: disagrees.filter(isGenderFemale).length,
              pass: passes.filter(isGenderFemale).length,
            },
            "?": {
              agree: agrees.filter(isGenderUnknown).length,
              disagree: disagrees.filter(isGenderUnknown).length,
              pass: passes.filter(isGenderUnknown).length,
            },
          },
          // TODO return all age ranges even if zero.
          age: _.mapObject(votesByAgeRange, (votes: any, ) => {
            const o = _.countBy(votes, "vote");
            return {
              agree: o[polisTypes.reactions.pull],
              disagree: o[polisTypes.reactions.push],
              pass: o[polisTypes.reactions.pass],
            };
          }),
        };
        return c;
      }
    );
  });
}

const translateAndStoreComment = Comment.translateAndStoreComment;

function handle_GET_comments_translations(
  req: { p: { zid: any; tid: any; lang: string } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: any): void; new (): any };
    };
  }
) {
  const zid = req.p.zid;
  const tid = req.p.tid;
  const firstTwoCharsOfLang = req.p.lang.substr(0, 2);

  getComment(zid, tid)
    //   Argument of type '(comment: {    txt: any;}) => globalThis.Promise<void>' is not assignable to parameter of type '(value: Row) => void | PromiseLike<void>'.
    // Types of parameters 'comment' and 'value' are incompatible.
    //   Property 'txt' is missing in type 'Row' but required in type '{ txt: any; }'.ts(2345)
    // @ts-ignore
    .then((comment: { txt: any }) => {
      return dbPgQuery
        .queryP(
          "select * from comment_translations where zid = ($1) and tid = ($2) and lang LIKE '$3%';",
          [zid, tid, firstTwoCharsOfLang]
        )
        .then((existingTranslations: any) => {
          if (existingTranslations) {
            return existingTranslations;
          }
          return translateAndStoreComment(zid, tid, comment.txt, req.p.lang);
        })
        .then((rows: any) => {
          res.status(200).json(rows || []);
        });
    })
    .catch((err: any) => {
      fail(res, 500, "polis_err_get_comments_translations", err);
    });
}

function handle_GET_comments(
  req: {
    headers?: Headers;
    p: { rid: any; include_demographics: any; zid: any; uid?: any };
  },
  res: any
) {
  const rid =
    req?.headers?.["x-request-id"] + " " + req?.headers?.["user-agent"];
  logger.debug("getComments begin", { rid });

  const isReportQuery = !_.isUndefined(req.p.rid);

  // Argument of type '{ rid: any; include_demographics: any; zid: any; uid?: any; }' is not assignable to parameter of type 'O'.
  //   Type '{ rid: any; include_demographics: any; zid: any; uid?: any; }' is missing the following properties from type 'O': include_voting_patterns, modIn, pid, tids, and 9 more.ts(2345)
  // @ts-ignore
  getComments(req.p)
    .then(function (comments: any) {
      if (req.p.rid) {
        return pgQueryP(
          "select tid, selection from report_comment_selections where rid = ($1);",
          [req.p.rid]
        ).then((selections: any) => {
          let tidToSelection = _.indexBy(selections, "tid");
          comments = comments.map(
            (c: { includeInReport: any; tid: string | number }) => {
              c.includeInReport =
                tidToSelection[c.tid] && tidToSelection[c.tid].selection > 0;
              return c;
            }
          );
          return comments;
        });
      } else {
        return comments;
      }
    })
    .then(function (comments: any[]) {
      if (req.p.include_demographics) {
        isModerator(req.p.zid, req.p.uid)
          .then((owner: any) => {
            if (owner || isReportQuery) {
              return getDemographicsForVotersOnComments(req.p.zid, comments)
                .then((commentsWithDemographics: any) => {
                  finishArray(res, commentsWithDemographics);
                })
                .catch((err: any) => {
                  fail(res, 500, "polis_err_get_comments3", err);
                });
            } else {
              fail(res, 500, "polis_err_get_comments_permissions");
            }
          })
          .catch((err: any) => {
            fail(res, 500, "polis_err_get_comments2", err);
          });
      } else {
        finishArray(res, comments);
      }
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_get_comments", err);
    });
} // end GET /api/v3/comments
function isDuplicateKey(err: {
  code: string | number;
  sqlState: string | number;
  messagePrimary: string | string[];
}) {
  let isdup =
    err.code === 23505 ||
    err.code === "23505" ||
    err.sqlState === 23505 ||
    err.sqlState === "23505" ||
    (err.messagePrimary &&
      err.messagePrimary.includes("duplicate key value"));
  return isdup;
}

function failWithRetryRequest(res: {
  setHeader: (arg0: string, arg1: number) => void;
  writeHead: (arg0: number) => {
    (): any;
    new (): any;
    send: { (arg0: number): void; new (): any };
  };
}) {
  res.setHeader("Retry-After", 0);
  logger.warn("failWithRetryRequest");
  res.writeHead(500).send(57493875);
}

function getNumberOfCommentsWithModerationStatus(zid: any, mod: any) {
  return meteredPromise(
    "getNumberOfCommentsWithModerationStatus",
    new Promise(function (resolve, reject) {
      pgQuery_readOnly(
        "select count(*) from comments where zid = ($1) and mod = ($2);",
        [zid, mod],
        function (err: any, result: { rows: { count: any }[] }) {
          if (err) {
            reject(err);
          } else {
            let count =
              result && result.rows && result.rows[0] && result.rows[0].count;
            count = Number(count);
            if (isNaN(count)) {
              count = void 0;
            }
            resolve(count);
          }
        }
      );
    })
  );
}

function sendCommentModerationEmail(
  req: any,
  uid: number,
  zid: any,
  unmoderatedCommentCount: string | number
) {
  if (_.isUndefined(unmoderatedCommentCount)) {
    unmoderatedCommentCount = "";
  }
  let body = unmoderatedCommentCount;
  if (unmoderatedCommentCount === 1) {
    body += " Statement is waiting for your review here: ";
  } else {
    body += " Statements are waiting for your review here: ";
  }

  getZinvite(zid)
    .catch(function (err: any) {
      logger.error("polis_err_getting_zinvite", err);
      return void 0;
    })
    .then(function (zinvite: any) {
      // NOTE: the counter goes in the email body so it doesn't create a new email thread (in Gmail, etc)

      body += createProdModerationUrl(zinvite);

      body += "\n\nThank you for using Metropolis.";

      // NOTE: adding a changing element (date) at the end to prevent gmail from thinking the URL is a signature, and hiding it. (since the URL doesn't change between emails, Gmail tries to be smart, and hides it)
      // "Sent: " + Date.now() + "\n";

      // NOTE: Adding zid to the subject to force the email client to create a new email thread.
      return sendEmailByUid(
        uid,
        `Waiting for review (conversation ${zinvite})`,
        body
      );
    })
    .catch(function (err: any) {
      logger.error("polis_err_sending_email", err);
    });
}

function createProdModerationUrl(zinvite: string) {
  return "https://metropolis.vote/m/" + zinvite;
}

function createModerationUrl(
  req: { p?: ConversationType; protocol?: string; headers?: Headers },
  zinvite: string
) {
  let server = Config.getServerUrl();
  if (domainOverride) {
    server = req?.protocol + "://" + domainOverride;
  }

  let url = server + "/m/" + zinvite;
  return url;
}

// function createMuteUrl(zid, tid) {
//     let server = Config.getServerUrl();
//     let params = {
//         zid: zid,
//         tid: tid
//     };
//     let path = "v3/mute";
//     params[HMAC_SIGNATURE_PARAM_NAME] = createHmacForQueryParams(path, params);
//     return server + "/"+path+"?" + paramsToStringSortedByName(params);
// }

// function createUnmuteUrl(zid, tid) {
//     let server = Config.getServerUrl();
//     let params = {
//         zid: zid,
//         tid: tid
//     };
//     let path = "v3/unmute";
//     params[HMAC_SIGNATURE_PARAM_NAME] = createHmacForQueryParams(path, params);
//     return server + "/"+path+"?" + paramsToStringSortedByName(params);
// }

function moderateComment(
  zid: string,
  tid: number,
  active: boolean,
  mod: boolean,
  is_meta: boolean
) {
  return new Promise(function (resolve, reject) {
    pgQuery(
      "UPDATE COMMENTS SET active=($3), mod=($4), modified=now_as_millis(), is_meta = ($5) WHERE zid=($1) and tid=($2);",
      [zid, tid, active, mod, is_meta],
      function (err: any) {
        if (err) {
          reject(err);
        } else {
          // TODO an optimization would be to only add the task when the comment becomes visible after the mod.
          addNotificationTask(zid);

          resolve(undefined);
        }
      }
    );
  });
}

const getComment = Comment.getComment;

// function muteComment(zid, tid) {
//     let mod = polisTypes.mod.ban;
//     return moderateComment(zid, tid, false, mod);
// }
// function unmuteComment(zid, tid) {
//     let mod = polisTypes.mod.ok;
//     return moderateComment(zid, tid, true, mod);
// }

// function handle_GET_mute(req, res) {
//     let tid = req.p.tid;
//     let zid = req.p.zid;
//     let params = {
//         zid: req.p.zid,
//         tid: req.p.tid,
//         signature: req.p[HMAC_SIGNATURE_PARAM_NAME],
//     };
//     verifyHmacForQueryParams("v3/mute", params).catch(function() {
//         fail(res, 403, "polis_err_signature_mismatch");
//     }).then(function() {
//         return muteComment(zid, tid);
//     }).then(function() {
//         return getComment(zid, tid);
//     }).then(function(c) {
//         res.set('Content-Type', 'text/html');
//         res.send(
//             "<h1>muted tid: "+c.tid+" zid:" + c.zid + "</h1>" +
//             "<p>" + c.txt + "</p>" +
//             "<a href=\"" + createUnmuteUrl(zid, tid) + "\">Unmute this comment.</a>"
//         );
//     }).catch(function(err) {
//     });
// }

// function handle_GET_unmute(req, res) {
//     let tid = req.p.tid;
//     let zid = req.p.zid;
//     let params = {
//         zid: req.p.zid,
//         tid: req.p.tid,
//         signature: req.p[HMAC_SIGNATURE_PARAM_NAME],
//     };
//     verifyHmacForQueryParams("v3/unmute", params).catch(function() {
//         fail(res, 403, "polis_err_signature_mismatch");
//     }).then(function() {
//         return unmuteComment(zid, tid);
//     }).then(function() {
//         return getComment(zid, tid);
//     }).then(function(c) {
//         res.set('Content-Type', 'text/html');
//         res.send(
//             "<h1>unmuted tid: "+c.tid+" zid:" + c.zid + "</h1>" +
//             "<p>" + c.txt + "</p>" +
//             "<a href=\"" + createMuteUrl(zid, tid) + "\">Mute this comment.</a>"
//         );
//     }).catch(function(err) {
//         fail(res, 500, err);
//     });
// }
function hasBadWords(txt: string) {
  txt = txt.toLowerCase();
  let tokens = txt.split(" ");
  for (var i = 0; i < tokens.length; i++) {
    if (badwords[tokens[i]]) {
      return true;
    }
  }
  return false;
}

function commentExists(zid: any, txt: any) {
  return pgQueryP(
    "select zid from comments where zid = ($1) and txt = ($2);",
    [zid, txt]
  ).then(function (rows: string | any[]) {
    return rows && rows.length;
  });
}

function handle_POST_comments(
  req: {
    p: {
      zid?: any;
      uid?: any;
      txt?: any;
      pid?: any;
      vote?: any;
      quote_txt?: any;
      quote_src_url?: any;
      anon?: any;
      is_seed?: any;
    };
    headers?: Headers;
    connection?: { remoteAddress: any; socket: { remoteAddress: any } };
    socket?: { remoteAddress: any };
  },
  res: { json: (arg0: { tid: any; currentPid: any }) => void }
) {
  let zid = req.p.zid;
  let xid = void 0; //req.p.xid;
  let uid = req.p.uid;
  let txt = req.p.txt;
  let pid = req.p.pid; // PID_FLOW may be undefined
  let currentPid = pid;
  let vote = req.p.vote;
  let quote_txt = req.p.quote_txt;
  let quote_src_url = req.p.quote_src_url;
  let anon = req.p.anon;
  let is_seed = req.p.is_seed;
  let mustBeModerator = !!quote_txt || anon;

  // either include txt, or a tweet id
  if (
    (_.isUndefined(txt) || txt === "") &&
    (_.isUndefined(quote_txt) || quote_txt === "")
  ) {
    fail(res, 400, "polis_err_param_missing_txt");
    return;
  }

  if (quote_txt && _.isUndefined(quote_src_url)) {
    fail(res, 400, "polis_err_param_missing_quote_src_url");
    return;
  }

  function doGetPid() {
    // PID_FLOW
    if (_.isUndefined(pid)) {
      return getPidPromise(req.p.zid, req.p.uid, true).then((pid: number) => {
        if (pid === -1) {
          //           Argument of type '(rows: any[]) => number' is not assignable to parameter of type '(value: unknown) => number | PromiseLike<number>'.
          // Types of parameters 'rows' and 'value' are incompatible.
          //             Type 'unknown' is not assignable to type 'any[]'.ts(2345)
          // @ts-ignore
          return addParticipant(req.p.zid, req.p.uid).then(function (
            rows: any[]
          ) {
            let ptpt = rows[0];
            pid = ptpt.pid;
            currentPid = pid;
            return pid;
          });
        } else {
          return pid;
        }
      });
    }
    return Promise.resolve(pid);
  }

  let ip =
    req?.headers?.["x-forwarded-for"] || // TODO This header may contain multiple IP addresses. Which should we report?
    req?.connection?.remoteAddress ||
    req?.socket?.remoteAddress ||
    req?.connection?.socket.remoteAddress;

  let isSpamPromise = isSpam({
    comment_content: txt,
    comment_author: uid,
    permalink: "https://metropolis.vote/" + zid,
    user_ip: ip,
    user_agent: req?.headers?.["user-agent"],
    referrer: req?.headers?.referer,
  });
  isSpamPromise.catch(function (err: any) {
    logger.error("isSpam failed", err);
  });
  let isModeratorPromise = isModerator(zid, uid);

  let conversationInfoPromise = getConversationInfo(zid);

  let shouldCreateXidRecord = false;

  let xidUserPromise =
    !_.isUndefined(xid) && !_.isNull(xid)
      ? getXidStuff(xid, zid)
      : Promise.resolve();
  const pidPromise = xidUserPromise.then(
    (xidUser: UserType | "noXidRecord") => {
      shouldCreateXidRecord = xidUser === "noXidRecord";
      if (typeof xidUser === "object") {
        uid = xidUser.uid;
        pid = xidUser.pid;
        return pid;
      } else {
        return doGetPid().then((pid: any) => {
          if (shouldCreateXidRecord) {
            // Expected 6 arguments, but got 3.ts(2554)
            // conversation.ts(34, 3): An argument for 'x_profile_image_url' was not provided.
            // @ts-ignore
            return createXidRecordByZid(zid, uid, xid).then(() => {
              return pid;
            });
          }
          return pid;
        });
      }
    }
  );


  let commentExistsPromise = commentExists(zid, txt);

  return Promise.all([
    pidPromise,
    conversationInfoPromise,
    isModeratorPromise,
    commentExistsPromise,
  ]).then(
    function (results: any[]) {
      let pid = results[0];
      let conv = results[1];
      let is_moderator = results[2];
      let commentExists = results[3];

      if (!is_moderator && mustBeModerator) {
        fail(res, 403, "polis_err_post_comment_auth");
        return;
      }

      if (pid < 0) {
        // NOTE: this API should not be called in /demo mode
        fail(res, 500, "polis_err_post_comment_bad_pid");
        return;
      }

      if (commentExists) {
        fail(res, 409, "polis_err_post_comment_duplicate");
        return;
      }

      if (!conv.is_active) {
        fail(res, 403, "polis_err_conversation_is_closed");
        return;
      }

      if (_.isUndefined(txt)) {
        logger.error("polis_err_post_comments_missing_txt");
        throw "polis_err_post_comments_missing_txt";
      }
      let bad = hasBadWords(txt);

      return isSpamPromise
        .then(
          function (spammy: any) {
            return spammy;
          },
          function (err: any) {
            logger.error("spam check failed", err);
            return false; // spam check failed, continue assuming "not spammy".
          }
        )
        .then(function (spammy: any) {
          let velocity = 1;
          let active = true;
          let classifications = [];
          if (bad && conv.profanity_filter) {
            active = false;
            classifications.push("bad");
            logger.info(
              "active=false because (bad && conv.profanity_filter)"
            );
          }
          if (spammy && conv.spam_filter) {
            active = false;
            classifications.push("spammy");
            logger.info(
              "active=false because (spammy && conv.spam_filter)"
            );
          }
          if (conv.strict_moderation) {
            active = false;
            logger.info(
              "active=false because (conv.strict_moderation)"
            );
          }

          let mod = 0; // hasn't yet been moderated.

          // moderators' comments are automatically in (when prepopulating).
          if (is_moderator && is_seed) {
            mod = polisTypes.mod.ok;
            active = true;
          }
          let authorUid = uid;

          Promise.all([detectLanguage(txt)]).then((a: any[]) => {
            let detections = a[0];
            let detection = Array.isArray(detections)
              ? detections[0]
              : detections;
            let lang = detection.language;
            let lang_confidence = detection.confidence;

            return pgQueryP(
              "INSERT INTO COMMENTS " +
                "(pid, zid, txt, velocity, active, mod, uid, tweet_id, quote_src_url, anon, is_seed, created, tid, lang, lang_confidence) VALUES " +
                "($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, default, null, $12, $13) RETURNING *;",
              [
                pid,
                zid,
                txt,
                velocity,
                active,
                mod,
                authorUid,
                null,
                quote_src_url || null,
                anon || false,
                is_seed || false,
                lang,
                lang_confidence,
              ]
            ).then(
              //                     Argument of type '(docs: any[]) => any' is not assignable to parameter of type '(value: unknown) => any'.
              // Types of parameters 'docs' and 'value' are incompatible.
              //                     Type 'unknown' is not assignable to type 'any[]'.ts(2345)
              // @ts-ignore
              function (docs: any[]) {
                let comment = docs && docs[0];
                let tid = comment && comment.tid;
                // let createdTime = comment && comment.created;

                if (bad || spammy || conv.strict_moderation) {
                  getNumberOfCommentsWithModerationStatus(
                    zid,
                    polisTypes.mod.unmoderated
                  )
                    .catch(function (err: any) {
                      logger.error(
                        "polis_err_getting_modstatus_comment_count",
                        err
                      );
                      return void 0;
                    })
                    .then(function (n: any) {
                      if (n === 0) {
                        return;
                      }
                      pgQueryP_readOnly(
                        "select * from users where site_id = (select site_id from page_ids where zid = ($1)) UNION select * from users where uid = ($2);",
                        [zid, conv.owner]
                      ).then(function (users: any) {
                        let uids = _.pluck(users, "uid");
                        // also notify polis team for moderation
                        uids.forEach(function (uid?: any) {
                          sendCommentModerationEmail(req, uid, zid, n);
                        });
                      });
                    });
                } else {
                  addNotificationTask(zid);
                }

                // It should be safe to delete this. Was added to postpone the no-auto-vote change for old conversations.
                if (is_seed && _.isUndefined(vote) && zid <= 17037) {
                  vote = 0;
                }

                let createdTime = comment.created;
                let votePromise = _.isUndefined(vote)
                  ? Promise.resolve()
                  : votesPost(uid, pid, zid, tid, vote, 0, false);

                return (
                  votePromise
                    // This expression is not callable.
                    //Each member of the union type '{ <U>(onFulfill?: ((value: void) => Resolvable<U>) | undefined, onReject?: ((error: any) => Resolvable<U>) | undefined): Bluebird<U>; <TResult1 = void, TResult2 = never>(onfulfilled?: ((value: void) => Resolvable<...>) | ... 1 more ... | undefined, onrejected?: ((reason: any) => Resolvable<...>) | ... 1 more ... | u...' has signatures, but none of those signatures are compatible with each other.ts(2349)
                    // @ts-ignore
                    .then(
                      function (o) {
                        if (o && o.vote && o.vote.created) {
                          createdTime = o.vote.created;
                        }

                        setTimeout(function () {
                          updateConversationModifiedTime(
                            zid,
                            createdTime
                          );
                          updateLastInteractionTimeForConversation(
                            zid,
                            uid
                          );
                          if (!_.isUndefined(vote)) {
                            updateVoteCount(zid, pid);
                          }
                        }, 100);

                        res.json({
                          tid: tid,
                          currentPid: currentPid,
                        });
                      },
                      function (err: any) {
                        fail(res, 500, "polis_err_vote_on_create", err);
                      }
                    )
                );
              },
              function (err: { code: string | number }) {
                if (err.code === "23505" || err.code === 23505) {
                  // duplicate comment
                  fail(
                    res,
                    409,
                    "polis_err_post_comment_duplicate",
                    err
                  );
                } else {
                  fail(res, 500, "polis_err_post_comment", err);
                }
              }
            ); // insert
          }); // lang
        });
    },
    function (errors: any[]) {
      if (errors[0]) {
        fail(res, 500, "polis_err_getting_pid", errors[0]);
        return;
      }
      if (errors[1]) {
        fail(res, 500, "polis_err_getting_conv_info", errors[1]);
        return;
      }
    }
  );
} // end POST /api/v3/comments

function handle_GET_votes_me(
  req: { p: { zid: any; uid?: any; pid: any } },
  res: any
) {
  getPid(req.p.zid, req.p.uid, function (err: any, pid: number) {
    if (err || pid < 0) {
      fail(res, 500, "polis_err_getting_pid", err);
      return;
    }
    pgQuery_readOnly(
      "SELECT * FROM votes WHERE zid = ($1) AND pid = ($2);",
      [req.p.zid, req.p.pid],
      function (err: any, docs: { rows: string | any[] }) {
        if (err) {
          fail(res, 500, "polis_err_get_votes_by_me", err);
          return;
        }
        for (var i = 0; i < docs.rows.length; i++) {
          docs.rows[i].weight = docs.rows[i].weight / 32767;
        }
        finishArray(res, docs.rows);
      }
    );
  });
}

function handle_GET_votes(req: { p: any }, res: any) {
  getVotesForSingleParticipant(req.p).then(
    function (votes: any) {
      finishArray(res, votes);
    },
    function (err: any) {
      fail(res, 500, "polis_err_votes_get", err);
    }
  );
}

function selectProbabilistically(
  comments: any,
  priorities: { [x: string]: any }
) {
  // Here we go through all of the comments we might select for the user and add their priority values
  let lookup = _.reduce(
    comments,
    (
      o: { lastCount: any; lookup: any[][] },
      comment: { tid: string | number }
    ) => {
      // If we like, we can use nTotal and nRemaining here to figure out how much we should emphasize the
      // priority, potentially. Maybe we end up with different classes of priorities lists for this purpose?
      // scaling this value in some way may also be helpful.
      let lookup_val = o.lastCount + (priorities[comment.tid] || 1);
      o.lookup.push([lookup_val, comment]);
      o.lastCount = lookup_val;
      return o;
    },
    { lastCount: 0, lookup: [] }
  );
  // We arrange a random number that should fall somewhere in the range of the lookup_vals
  let randomN = Math.random() * lookup.lastCount;
  // Return the first one that has a greater lookup; could eventually replace this with something smarter
  // that does a bisectional lookup if performance becomes an issue. But I want to keep the implementation
  // simple to reason about all other things being equal.
  let result = _.find(lookup.lookup, (x: number[]) => x[0] > randomN);
  let c = result?.[1];
  c.randomN = randomN;
  return c;
}

// This very much follows the outline of the random selection above, but factors out the probabilistic logic
// to the selectProbabilistically fn above.
function getNextPrioritizedComment(
  zid: string,
  pid: string,
  withoutTids: string | any[],
  include_social: any
) {
  // Type '{ zid: string; not_voted_by_pid: string; include_social: any; }' is missing the following properties from type 'CommentType': withoutTids, include_voting_patterns, modIn, pid, and 7 more.ts(2740)
  // @ts-ignore
  let params: CommentType = {
    zid: zid,
    not_voted_by_pid: pid,
    include_social: include_social,
  };
  if (!_.isUndefined(withoutTids) && withoutTids.length) {
    params.withoutTids = withoutTids;
  }
  // What should we set timestamp to below in getPca? Is 0 ok? What triggers updates?
  return Promise.all([
    getComments(params),
    getPca(zid, 0),
    getNumberOfCommentsRemaining(zid, pid),
  ]).then((results: any[]) => {
    let comments = results[0];
    let math = results[1];
    let numberOfCommentsRemainingRows = results[2];
    logger.debug("getNextPrioritizedComment intermediate results:", {
      zid,
      pid,
      numberOfCommentsRemainingRows,
    });
    if (!comments || !comments.length) {
      return null;
    } else if (
      !numberOfCommentsRemainingRows ||
      !numberOfCommentsRemainingRows.length
    ) {
      throw new Error(
        "polis_err_getNumberOfCommentsRemaining_" + zid + "_" + pid
      );
    }
    let commentPriorities = math
      ? math.asPOJO["comment-priorities"] || {}
      : {};
    let nTotal = Number(numberOfCommentsRemainingRows[0].total);
    let nRemaining = Number(numberOfCommentsRemainingRows[0].remaining);
    let c = selectProbabilistically(comments, commentPriorities);
    c.remaining = nRemaining;
    c.total = nTotal;
    return c;
  });
}

function getCommentTranslations(zid: any, tid: any) {
  return dbPgQuery.queryP(
    "select * from comment_translations where zid = ($1) and tid = ($2);",
    [zid, tid]
  );
}

function getNextComment(
  zid?: any,
  pid?: any,
  withoutTids?: any,
  include_social?: boolean,
  lang?: string
) {
  return getNextPrioritizedComment(
    zid,
    pid,
    withoutTids,
    include_social
  ).then((c: CommentType) => {
    if (lang && c) {
      const firstTwoCharsOfLang = lang.substr(0, 2);
      return getCommentTranslations(zid, c.tid).then((translations: any) => {
        c.translations = translations;
        let hasMatch = _.some(translations, (t: { lang: string }) => {
          return t.lang.startsWith(firstTwoCharsOfLang);
        });
        if (!hasMatch) {
          return translateAndStoreComment(zid, c.tid, c.txt, lang).then(
            (translation: any) => {
              if (translation) {
                c.translations.push(translation);
              }
              return c;
            }
          );
        }
        return c;
      });
    } else if (c) {
      c.translations = [];
    }
    return c;
  });
}

// NOTE: only call this in response to a vote. Don't call this from a poll, like /api/v3/nextComment
function addNoMoreCommentsRecord(zid: any, pid: any) {
  return pgQueryP(
    "insert into event_ptpt_no_more_comments (zid, pid, votes_placed) values ($1, $2, " +
      "(select count(*) from votes where zid = ($1) and pid = ($2)))",
    [zid, pid]
  );
}

function handle_GET_nextComment(
  req: {
    timedout: any;
    p: {
      zid: any;
      not_voted_by_pid: any;
      without: any;
      include_social: any;
      lang: any;
    };
  },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: {}): void; new (): any };
    };
  }
) {
  if (req.timedout) {
    return;
  }
  // NOTE: I tried to speed up this query by adding db indexes, and by removing queries like getConversationInfo and finishOne.
  //          They didn't help much, at least under current load, which is negligible. pg:diagnose isn't complaining about indexes.
  //      I think the direction to go as far as optimizing this is to asyncronously build up a synced in-ram list of next comments
  //        for each participant, for currently active conversations. (this would probably be a math-poller-esque process on another
  //         hostclass)
  //         Along with this would be to cache in ram info about moderation status of each comment so we can filter before returning a comment.

  getNextComment(
    req.p.zid,
    req.p.not_voted_by_pid,
    req.p.without,
    req.p.include_social,
    req.p.lang
  )
    .then(
      function (c: { currentPid: any }) {
        if (req.timedout) {
          return;
        }
        if (c) {
          if (!_.isUndefined(req.p.not_voted_by_pid)) {
            c.currentPid = req.p.not_voted_by_pid;
          }
          finishOne(res, c);
        } else {
          let o: CommentOptions = {};
          if (!_.isUndefined(req.p.not_voted_by_pid)) {
            o.currentPid = req.p.not_voted_by_pid;
          }
          res.status(200).json(o);
        }
      },
      function (err: any) {
        if (req.timedout) {
          return;
        }
        fail(res, 500, "polis_err_get_next_comment2", err);
      }
    )
    .catch(function (err: any) {
      if (req.timedout) {
        return;
      }
      fail(res, 500, "polis_err_get_next_comment", err);
    });
}
function handle_GET_participationInit(
  req: {
    p: {
      conversation_id: any;
      uid?: any;
      lang: string;
      zid: any;
      xid: any;
      owner_uid?: any;
      pid: any;
    };
    headers?: Headers;
    cookies: { [x: string]: any };
  },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: {
        (arg0: {
          user: any;
          ptpt: any;
          nextComment: any;
          conversation: any;
          votes: any;
          pca: any;
          famous: any;
          // famous: JSON.parse(arr[6]),
          acceptLanguage: any;
        }): void;
        new (): any;
      };
    };
  }
) {
  logger.info("handle_GET_participationInit");
  // let qs = {
  //   conversation_id: req.p.conversation_id,
  // };

  // let nextCommentQs = Object.assign({}, qs, {
  //   not_voted_by_pid: "mypid",
  //   limit: 1,
  //   include_social: true,
  // });

  // let votesByMeQs = Object.assign({}, req.p, {
  //   pid: "mypid",
  // });

  // let famousQs = req.p.ptptoiLimit ? Object.assign({}, qs, {
  //   ptptoiLimit: req.p.ptptoiLimit,
  // }) : qs;

  // function getIfConv() {
  //   if (qs.conversation_id) {
  //     return request.get.apply(request, arguments);
  //   } else {
  //     return Promise.resolve("null");
  //   }
  // }

  // function getIfConvAndAuth() {
  //   if (req.p.uid) {
  //     return getIfConv.apply(0, arguments);
  //   } else {
  //     return Promise.resolve("null");
  //   }
  // }

  // function getWith304AsSuccess() {
  //   return getIfConv.apply(0, arguments).catch(function(foo) {
  //     if (foo.statusCode === 304) {
  //       return "null";
  //     } else {
  //       throw foo;
  //     }
  //   });
  // }

  function ifConv(
    f: {
      (
        zid: any,
        pid: any,
        withoutTids: any,
        include_social: any,
        lang?: any
      ): CommentType;
      (zid: any, uid?: any, lang?: any): any;
      (p: any): any;
      (zid: any, math_tick: any): any;
      (o: any, req: any): any;
      apply?: any;
    },
    args: any[]
  ) {
    if (req.p.conversation_id) {
      return f.apply(null, args);
    } else {
      return Promise.resolve(null);
    }
  }

  function ifConvAndAuth(f: (zid: any, uid?: any) => any, args: any[]) {
    if (req.p.uid) {
      return ifConv(f, args);
    } else {
      return Promise.resolve(null);
    }
  }

  let acceptLanguage =
    req?.headers?.["accept-language"] ||
    req?.headers?.["Accept-Language"] ||
    "en-US";

  if (req.p.lang === "acceptLang") {
    // "en-US,en;q=0.8,da;q=0.6,it;q=0.4,es;q=0.2,pt-BR;q=0.2,pt;q=0.2" --> "en-US"
    // req.p.lang = acceptLanguage.match("^[^,;]*")[0];
    req.p.lang = acceptLanguage.substr(0, 2);
  }

  getPermanentCookieAndEnsureItIsSet(req, res);

  Promise.all([
    // request.get({uri: "http://" + SELF_HOSTNAME + "/api/v3/users", qs: qs, headers: req.headers, gzip: true}),
    getUser(req.p.uid, req.p.zid, req.p.xid, req.p.owner_uid),
    // getIfConvAndAuth({uri: "http://" + SELF_HOSTNAME + "/api/v3/participants", qs: qs, headers: req.headers, gzip: true}),
    ifConvAndAuth(getParticipant, [req.p.zid, req.p.uid]),
    // getIfConv({uri: "http://" + SELF_HOSTNAME + "/api/v3/nextComment", qs: nextCommentQs, headers: req.headers, gzip: true}),
    //
    // Argument of type '(zid?: any, pid?: any, withoutTids?: any, include_social?: boolean | undefined, lang?: string | undefined) => Bluebird<any>' is not assignable to parameter of type '{ (zid: any, pid: any, withoutTids: any, include_social: any, lang?: any): CommentType; (zid: any, uid?: any, lang?: any): any; (p: any): any; (zid: any, math_tick: any): any; (o: any, req: any): any; apply?: any; }'.
    //  Type 'Bluebird<any>' is missing the following properties from type 'CommentType': zid, not_voted_by_pid, withoutTids, include_voting_patterns, and 9 more.ts(2345)
    // @ts-ignore
    ifConv(getNextComment, [req.p.zid, req.p.pid, [], true, req.p.lang]),
    // getIfConv({uri: "http://" + SELF_HOSTNAME + "/api/v3/conversations", qs: qs, headers: req.headers, gzip: true}),
    //
    // Argument of type '(zid: any, uid?: any, lang?: null | undefined) => Bluebird<any>' is not assignable to parameter of type '{ (zid: any, pid: any, withoutTids: any, include_social: any, lang?: any): CommentType; (zid: any, uid?: any, lang?: any): any; (p: any): any; (zid: any, math_tick: any): any; (o: any, req: any): any; apply?: any; }'.
    // Type 'Bluebird<any>' is not assignable to type 'CommentType'.ts(2345)
    // @ts-ignore
    ifConv(getOneConversation, [req.p.zid, req.p.uid, req.p.lang]),
    // getIfConv({uri: "http://" + SELF_HOSTNAME + "/api/v3/votes", qs: votesByMeQs, headers: req.headers, gzip: true}),
    // @ts-ignore
    ifConv(getVotesForSingleParticipant, [req.p]),
    //
    // Argument of type '(zid?: any, math_tick?: number | undefined) => Promise<any>' is not assignable to parameter of type '{ (zid: any, pid: any, withoutTids: any, include_social: any, lang?: any): CommentType; (zid: any, uid?: any, lang?: any): any; (p: any): any; (zid: any, math_tick: any): any; (o: any, req: any): any; apply?: any; }'.
    // Type 'Promise<any>' is missing the following properties from type 'CommentType': zid, not_voted_by_pid, withoutTids, include_voting_patterns, and 9 more.ts(2345)
    // @ts-ignore
    ifConv(getPca, [req.p.zid, -1]),
    // getWith304AsSuccess({uri: "http://" + SELF_HOSTNAME + "/api/v3/math/pca2", qs: qs, headers: req.headers, gzip: true}),
    //
    // Argument of type '(o?: { uid?: any; zid: any; math_tick: any; ptptoiLimit: any; } | undefined, req?: any) => Bluebird<{}>' is not assignable to parameter of type '{ (zid: any, pid: any, withoutTids: any, include_social: any, lang?: any): CommentType; (zid: any, uid?: any, lang?: any): any; (p: any): any; (zid: any, math_tick: any): any; (o: any, req: any): any; apply?: any; }'.
    //   Type 'Bluebird<{}>' is missing the following properties from type 'CommentType': zid, not_voted_by_pid, withoutTids, include_voting_patterns, and 9 more.ts(2345)
    // @ts-ignore
    ifConv(doFamousQuery, [req.p, req]),
    // getIfConv({uri: "http://" + SELF_HOSTNAME + "/api/v3/votes/famous", qs: famousQs, headers: req.headers, gzip: true}),
  ])
    .then(
      function (arr: any[]) {
        let conv = arr[3];
        let o = {
          user: arr[0],
          ptpt: arr[1],
          nextComment: arr[2],
          conversation: conv,
          votes: arr[4] || [],
          pca: arr[5] ? (arr[5].asJSON ? arr[5].asJSON : null) : null,
          famous: arr[6],
          // famous: JSON.parse(arr[6]),
          acceptLanguage: acceptLanguage,
        };
        if (o.conversation) {
          delete o.conversation.zid;
          o.conversation.conversation_id = req.p.conversation_id;
        }
        if (o.ptpt) {
          delete o.ptpt.zid;
        }
        for (var i = 0; i < o.votes.length; i++) {
          delete o.votes[i].zid; // strip zid for security
          // delete o.votes[i].pid; // because it's extra crap. Feel free to delete this line if you need pid.
        }
        if (!o.nextComment) {
          o.nextComment = {};
        }
        if (!_.isUndefined(req.p.pid)) {
          o.nextComment.currentPid = req.p.pid;
        }

        res.status(200).json(o);
      },
      function (err: any) {
        fail(res, 500, "polis_err_get_participationInit2", err);
      }
    )
    .catch(function (err: any) {
      fail(res, 500, "polis_err_get_participationInit", err);
    });
}

function updateConversationModifiedTime(zid: any, t?: undefined) {
  let modified = _.isUndefined(t) ? Date.now() : Number(t);
  let query =
    "update conversations set modified = ($2) where zid = ($1) and modified < ($2);";
  let params = [zid, modified];
  if (_.isUndefined(t)) {
    query =
      "update conversations set modified = now_as_millis() where zid = ($1);";
    params = [zid];
  }
  return pgQueryP(query, params);
}

const createXidRecordByZid = Conversation.createXidRecordByZid;
const getXidStuff = User.getXidStuff;

function handle_PUT_participants_extended(
  req: { p: { zid: any; uid?: any; show_translation_activated: any } },
  res: { json: (arg0: any) => void }
) {
  let zid = req.p.zid;
  let uid = req.p.uid;

  let fields: ParticipantFields = {};
  if (!_.isUndefined(req.p.show_translation_activated)) {
    fields.show_translation_activated = req.p.show_translation_activated;
  }

  let q = sql_participants_extended
    .update(fields)
    .where(sql_participants_extended.zid.equals(zid))
    .and(sql_participants_extended.uid.equals(uid));

  pgQueryP(q.toString(), [])
    .then((result: any) => {
      res.json(result);
    })
    .catch((err: any) => {
      fail(res, 500, "polis_err_put_participants_extended", err);
    });
}

function handle_POST_votes(
  req: {
    p: Vote;
    cookies: { [x: string]: any };
    headers?: Headers;
  },
  res: any
) {
  let uid = req.p.uid; // PID_FLOW uid may be undefined here.
  let zid = req.p.zid;
  let pid = req.p.pid; // PID_FLOW pid may be undefined here.
  let lang = req.p.lang;

  // We allow viewing (and possibly writing) without cookies enabled, but voting requires cookies (except the auto-vote on your own comment, which seems ok)
  let token = req.cookies[COOKIES.TOKEN];
  let apiToken = req?.headers?.authorization || "";
  let xPolisHeaderToken = req?.headers?.["x-polis"];
  if (!uid && !token && !apiToken && !xPolisHeaderToken) {
    fail(res, 403, "polis_err_vote_noauth");
    return;
  }

  let permanent_cookie = getPermanentCookieAndEnsureItIsSet(req, res);

  // PID_FLOW WIP for now assume we have a uid, but need a participant record.
  let pidReadyPromise = _.isUndefined(req.p.pid)
    ? addParticipantAndMetadata(
        req.p.zid,
        req.p.uid,
        req,
        permanent_cookie
      ).then(function (rows: any[]) {
        let ptpt = rows[0];
        pid = ptpt.pid;
      })
    : Promise.resolve();
  pidReadyPromise
    .then(function () {
      // let conv;
      let vote;

      // PID_FLOW WIP for now assume we have a uid, but need a participant record.
      let pidReadyPromise = _.isUndefined(pid)
        ? //         Argument of type '(rows: any[]) => void' is not assignable to parameter of type '(value: unknown) => void | PromiseLike<void>'.
          // Types of parameters 'rows' and 'value' are incompatible.
          //         Type 'unknown' is not assignable to type 'any[]'.ts(2345)
          // @ts-ignore
          addParticipant(zid, uid).then(function (rows: any[]) {
            let ptpt = rows[0];
            pid = ptpt.pid;
          })
        : Promise.resolve();

      return pidReadyPromise
        .then(function () {
          return votesPost(
            uid,
            pid,
            zid,
            req.p.tid,
            req.p.vote,
            req.p.weight,
            req.p.high_priority
          );
        })
        .then(function (o: { vote: any }) {
          // conv = o.conv;
          vote = o.vote;
          let createdTime = vote.created;
          setTimeout(function () {
            updateConversationModifiedTime(zid, createdTime);
            updateLastInteractionTimeForConversation(zid, uid);

            // NOTE: may be greater than number of comments, if they change votes
            updateVoteCount(zid, pid);
          }, 100);
          if (_.isUndefined(req.p.starred)) {
            return;
          } else {
            return addStar(zid, req.p.tid, pid, req.p.starred, createdTime);
          }
        })
        .then(function () {
          return getNextComment(zid, pid, [], true, lang);
        })
        .then(function (nextComment: any) {
          logger.debug("handle_POST_votes nextComment:", {
            zid,
            pid,
            nextComment,
          });
          let result: PidReadyResult = {};
          if (nextComment) {
            result.nextComment = nextComment;
          } else {
            // no need to wait for this to finish
            addNoMoreCommentsRecord(zid, pid);
          }
          // PID_FLOW This may be the first time the client gets the pid.
          result.currentPid = pid;
          // result.shouldMod = true; // TODO
          if (result.shouldMod) {
            result.modOptions = {};
            if (req.p.vote === polisTypes.reactions.pull) {
              result.modOptions.as_important = true;
              result.modOptions.as_factual = true;
              result.modOptions.as_feeling = true;
            } else if (req.p.vote === polisTypes.reactions.push) {
              result.modOptions.as_notmyfeeling = true;
              result.modOptions.as_notgoodidea = true;
              result.modOptions.as_notfact = true;
              result.modOptions.as_abusive = true;
            } else if (req.p.vote === polisTypes.reactions.pass) {
              result.modOptions.as_unsure = true;
              result.modOptions.as_spam = true;
              result.modOptions.as_abusive = true;
            }
          }

          finishOne(res, result);
        });
    })
    .catch(function (err: string) {
      if (err === "polis_err_vote_duplicate") {
        fail(res, 406, "polis_err_vote_duplicate", err); // TODO allow for changing votes?
      } else if (err === "polis_err_conversation_is_closed") {
        fail(res, 403, "polis_err_conversation_is_closed", err);
      } else if (err === "polis_err_post_votes_social_needed") {
        fail(res, 403, "polis_err_post_votes_social_needed", err);
      } else {
        fail(res, 500, "polis_err_vote", err);
      }
    });
}

function handle_POST_ptptCommentMod(
  req: {
    p: {
      zid: any;
      pid: any;
      uid?: any;
      tid: any;
      as_abusive: any;
      as_factual: any;
      as_feeling: any;
      as_important: any;
      as_notfact: any;
      as_notgoodidea: any;
      as_notmyfeeling: any;
      as_offtopic: any;
      as_spam: any;
      unsure: any;
      lang: any;
    };
  },
  res: any
) {
  let zid = req.p.zid;
  let pid = req.p.pid;

  let uid = req.p.uid;

  // need('as_important', getBool, assignToP, false),
  // need('as_spam', getBool, assignToP, false),
  // need('as_offtopic', getBool, assignToP, false),

  return pgQueryP(
    "insert into crowd_mod (" +
      "zid, " +
      "pid, " +
      "tid, " +
      "as_abusive, " +
      "as_factual, " +
      "as_feeling, " +
      "as_important, " +
      "as_notfact, " +
      "as_notgoodidea, " +
      "as_notmyfeeling, " +
      "as_offtopic, " +
      "as_spam, " +
      "as_unsure) values (" +
      "$1, " +
      "$2, " +
      "$3, " +
      "$4, " +
      "$5, " +
      "$6, " +
      "$7, " +
      "$8, " +
      "$9, " +
      "$10, " +
      "$11, " +
      "$12, " +
      "$13);",
    [
      req.p.zid,
      req.p.pid,
      req.p.tid,
      req.p.as_abusive,
      req.p.as_factual,
      req.p.as_feeling,
      req.p.as_important,
      req.p.as_notfact,
      req.p.as_notgoodidea,
      req.p.as_notmyfeeling,
      req.p.as_offtopic,
      req.p.as_spam,
      req.p.unsure,
    ]
  )
    .then((createdTime: any) => {
      setTimeout(function () {
        updateConversationModifiedTime(req.p.zid, createdTime);
        updateLastInteractionTimeForConversation(zid, uid);
      }, 100);
    })
    .then(function () {
      return getNextComment(req.p.zid, pid, [], true, req.p.lang); // TODO req.p.lang is probably not defined
    })
    .then(function (nextComment: any) {
      let result: ParticipantCommentModerationResult = {};
      if (nextComment) {
        result.nextComment = nextComment;
      } else {
        // no need to wait for this to finish
        addNoMoreCommentsRecord(req.p.zid, pid);
      }
      // PID_FLOW This may be the first time the client gets the pid.
      result.currentPid = req.p.pid;
      finishOne(res, result);
    })
    .catch(function (err: string) {
      if (err === "polis_err_ptptCommentMod_duplicate") {
        fail(res, 406, "polis_err_ptptCommentMod_duplicate", err); // TODO allow for changing votes?
      } else if (err === "polis_err_conversation_is_closed") {
        fail(res, 403, "polis_err_conversation_is_closed", err);
      } else {
        fail(res, 500, "polis_err_ptptCommentMod", err);
      }
    });
}

function handle_POST_upvotes(
  req: { p: { uid?: any; zid: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: {}): void; new (): any };
    };
  }
) {
  let uid = req.p.uid;
  let zid = req.p.zid;

  pgQueryP("select * from upvotes where uid = ($1) and zid = ($2);", [
    uid,
    zid,
  ]).then(
    function (rows: string | any[]) {
      if (rows && rows.length) {
        fail(res, 403, "polis_err_upvote_already_upvoted");
      } else {
        pgQueryP("insert into upvotes (uid, zid) VALUES ($1, $2);", [
          uid,
          zid,
        ]).then(
          function () {
            pgQueryP(
              "update conversations set upvotes = (select count(*) from upvotes where zid = ($1)) where zid = ($1);",
              [zid]
            ).then(
              function () {
                res.status(200).json({});
              },
              function (err: any) {
                fail(res, 500, "polis_err_upvote_update", err);
              }
            );
          },
          function (err: any) {
            fail(res, 500, "polis_err_upvote_insert", err);
          }
        );
      }
    },
    function (err: any) {
      fail(res, 500, "polis_err_upvote_check", err);
    }
  );
}
function addStar(
  zid: any,
  tid: any,
  pid: any,
  starred: number,
  created?: undefined
) {
  starred = starred ? 1 : 0;
  let query =
    "INSERT INTO stars (pid, zid, tid, starred, created) VALUES ($1, $2, $3, $4, default) RETURNING created;";
  let params = [pid, zid, tid, starred];
  if (!_.isUndefined(created)) {
    query =
      "INSERT INTO stars (pid, zid, tid, starred, created) VALUES ($1, $2, $3, $4, $5) RETURNING created;";
    params.push(created);
  }
  return pgQueryP(query, params);
}
function handle_POST_stars(
  req: { p: { zid: any; tid: any; pid: any; starred: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: {}): void; new (): any };
    };
  }
) {
  addStar(req.p.zid, req.p.tid, req.p.pid, req.p.starred)
    //     Argument of type '(result: { rows: { created: any; }[]; }) => void' is not assignable to parameter of type '(value: unknown) => void | PromiseLike<void>'.
    // Types of parameters 'result' and 'value' are incompatible.
    //     Type 'unknown' is not assignable to type '{ rows: { created: any; }[]; }'.ts(2345)
    // @ts-ignore
    .then(function (result: { rows: { created: any }[] }) {
      let createdTime = result.rows[0].created;
      setTimeout(function () {
        updateConversationModifiedTime(req.p.zid, createdTime);
      }, 100);
      res.status(200).json({}); // TODO don't stop after the first one, map the inserts to deferreds.
    })
    .catch(function (err: any) {
      if (err) {
        if (isDuplicateKey(err)) {
          fail(res, 406, "polis_err_vote_duplicate", err); // TODO allow for changing votes?
        } else {
          fail(res, 500, "polis_err_vote", err);
        }
      }
    });
}

function handle_POST_trashes(
  req: { p: { pid: any; zid: any; tid: any; trashed: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: {}): void; new (): any };
    };
  }
) {
  let query =
    "INSERT INTO trashes (pid, zid, tid, trashed, created) VALUES ($1, $2, $3, $4, default);";
  let params = [req.p.pid, req.p.zid, req.p.tid, req.p.trashed];
  pgQuery(
    query,
    params,
    function (err: any, result: { rows: { created: any }[] }) {
      if (err) {
        if (isDuplicateKey(err)) {
          fail(res, 406, "polis_err_vote_duplicate", err); // TODO allow for changing votes?
        } else {
          fail(res, 500, "polis_err_vote", err);
        }
        return;
      }

      let createdTime = result.rows[0].created;
      setTimeout(function () {
        updateConversationModifiedTime(req.p.zid, createdTime);
      }, 100);

      res.status(200).json({}); // TODO don't stop after the first one, map the inserts to deferreds.
    }
  );
}
function verifyMetadataAnswersExistForEachQuestion(zid: any) {
  let errorcode = "polis_err_missing_metadata_answers";
  return new Promise(function (resolve, reject) {
    pgQuery_readOnly(
      "select pmqid from participant_metadata_questions where zid = ($1);",
      [zid],
      function (err: any, results: { rows: any[] }) {
        if (err) {
          reject(err);
          return;
        }
        if (!results.rows || !results.rows.length) {
          resolve(undefined);
          return;
        }
        let pmqids = results.rows.map(function (row: { pmqid: any }) {
          return Number(row.pmqid);
        });
        pgQuery_readOnly(
          "select pmaid, pmqid from participant_metadata_answers where pmqid in (" +
            pmqids.join(",") +
            ") and alive = TRUE and zid = ($1);",
          [zid],
          function (err: any, results: { rows: any[] }) {
            if (err) {
              reject(err);
              return;
            }
            if (!results.rows || !results.rows.length) {
              reject(new Error(errorcode));
              return;
            }
            let questions = _.reduce(
              pmqids,
              function (o: { [x: string]: number }, pmqid: string | number) {
                o[pmqid] = 1;
                return o;
              },
              {}
            );
            results.rows.forEach(function (row: { pmqid: string | number }) {
              delete questions[row.pmqid];
            });
            if (Object.keys(questions).length) {
              reject(new Error(errorcode));
            } else {
              resolve(undefined);
            }
          }
        );
      }
    );
  });
}

function handle_PUT_comments(
  req: {
    p: { uid?: any; zid: any; tid: any; active: any; mod: any; is_meta: any };
  },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: {}): void; new (): any };
    };
  }
) {
  let uid = req.p.uid;
  let zid = req.p.zid;
  let tid = req.p.tid;
  let active = req.p.active;
  let mod = req.p.mod;
  let is_meta = req.p.is_meta;

  isModerator(zid, uid)
    .then(function (isModerator: any) {
      if (isModerator) {
        moderateComment(zid, tid, active, mod, is_meta).then(
          function () {
            res.status(200).json({});
          },
          function (err: any) {
            fail(res, 500, "polis_err_update_comment", err);
          }
        );
      } else {
        fail(res, 403, "polis_err_update_comment_auth");
      }
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_update_comment", err);
    });
}

function handle_POST_reportCommentSelections(
  req: { p: { uid?: any; zid: any; rid: any; tid: any; include: any } },
  res: { json: (arg0: {}) => void }
) {
  let uid = req.p.uid;
  let zid = req.p.zid;
  let rid = req.p.rid;
  let tid = req.p.tid;
  let selection = req.p.include ? 1 : -1;
  isModerator(zid, uid)
    .then((isMod: any) => {
      if (!isMod) {
        return fail(res, 403, "polis_err_POST_reportCommentSelections_auth");
      }
      return pgQueryP(
        "insert into report_comment_selections (rid, tid, selection, zid, modified) values ($1, $2, $3, $4, now_as_millis()) " +
          "on conflict (rid, tid) do update set selection = ($3), zid  = ($4), modified = now_as_millis();",
        [rid, tid, selection, zid]
      )
        .then(() => {
          // The old report isn't valid anymore, so when a user loads the report again a new worker_tasks entry will be created.
          return pgQueryP(
            "delete from math_report_correlationmatrix where rid = ($1);",
            [rid]
          );
        })
        .then(() => {
          res.json({});
        });
    })
    .catch((err: any) => {
      fail(res, 500, "polis_err_POST_reportCommentSelections_misc", err);
    });
}
// kind of crappy that we're replacing the zinvite.
// This is needed because we initially create a conversation with the POST, then actually set the properties with the subsequent PUT.
// if we stop doing that, we can remove this function.
function generateAndReplaceZinvite(zid: any, generateShortZinvite: any) {
  let len = 12;
  if (generateShortZinvite) {
    len = 6;
  }
  return new Promise(function (
    resolve: (arg0: any) => void,
    reject: (arg0: string) => void
  ) {
    generateToken(len, false, function (err: any, zinvite: any) {
      if (err) {
        return reject("polis_err_creating_zinvite");
      }
      pgQuery(
        "update zinvites set zinvite = ($1) where zid = ($2);",
        [zinvite, zid],
        function (err: any) {
          if (err) {
            reject(err);
          } else {
            resolve(zinvite);
          }
        }
      );
    });
  });
}

function handle_POST_conversation_close(
  req: { p: { zid: any; uid?: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: {}): void; new (): any };
    };
  }
) {
  var q = "select * from conversations where zid = ($1)";
  var params = [req.p.zid];
  if (!isPolisDev(req.p.uid)) {
    q = q + " and owner = ($2)";
    params.push(req.p.uid);
  }
  pgQueryP(q, params)
    .then(function (rows: string | any[]) {
      if (!rows || !rows.length) {
        fail(res, 500, "polis_err_closing_conversation_no_such_conversation");
        return;
      }
      let conv = rows[0];
      pgQueryP(
        "update conversations set is_archived = true where zid = ($1);",
        [conv.zid]
      )
        .then(function () {
          res.status(200).json({});
        })
        .catch(function (err: any) {
          fail(res, 500, "polis_err_closing_conversation2", err);
        });
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_closing_conversation", err);
    });
}

function handle_POST_conversation_reopen(
  req: { p: { zid: any; uid?: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: {}): void; new (): any };
    };
  }
) {
  var q = "select * from conversations where zid = ($1)";
  var params = [req.p.zid];
  if (!isPolisDev(req.p.uid)) {
    q = q + " and owner = ($2)";
    params.push(req.p.uid);
  }
  pgQueryP(q, params)
    .then(function (rows: string | any[]) {
      if (!rows || !rows.length) {
        fail(res, 500, "polis_err_closing_conversation_no_such_conversation");
        return;
      }
      let conv = rows[0];
      pgQueryP(
        "update conversations set is_archived = false where zid = ($1);",
        [conv.zid]
      )
        .then(function () {
          res.status(200).json({});
        })
        .catch(function (err: any) {
          fail(res, 500, "polis_err_reopening_conversation2", err);
        });
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_reopening_conversation", err);
    });
}

function handle_PUT_users(
  req: { p: { uid?: any; uid_of_user: any; email: any; hname: any } },
  res: { json: (arg0: any) => void }
) {
  let uid = req.p.uid;
  if (isPolisDev(uid) && req.p.uid_of_user) {
    uid = req.p.uid_of_user;
  }

  let fields: UserType = {};
  if (!_.isUndefined(req.p.email)) {
    fields.email = req.p.email;
  }
  if (!_.isUndefined(req.p.hname)) {
    fields.hname = req.p.hname;
  }

  let q = sql_users.update(fields).where(sql_users.uid.equals(uid));

  pgQueryP(q.toString(), [])
    .then((result: any) => {
      res.json(result);
    })
    .catch((err: any) => {
      fail(res, 500, "polis_err_put_user", err);
    });
}

function handle_PUT_conversations(
  req: {
    p: {
      short_url: any;
      zid: any;
      uid?: any;
      verifyMeta: any;
      is_active: any;
      is_anon: any;
      is_draft: any;
      is_data_open: any;
      profanity_filter: any;
      spam_filter: any;
      strict_moderation: any;
      topic: string;
      description: string;
      survey_caption: string;
      postsurvey: string;
      postsurvey_limit: number;
      postsurvey_submissions: number;
      postsurvey_redirect: number;
      vis_type: any;
      help_type: any;
      socialbtn_type: any;
      bgcolor: string;
      help_color: string;
      help_bgcolor: string;
      style_btn: any;
      write_type: any;
      owner_sees_participation_stats: any;
      launch_presentation_return_url_hex: any;
      link_url: any;
      send_created_email: any;
      conversation_id: string;
      context: any;
    };
  },
  res: any
) {
  let generateShortUrl = req.p.short_url;
  isModerator(req.p.zid, req.p.uid)
    .then(function (ok: any) {
      if (!ok) {
        fail(res, 403, "polis_err_update_conversation_permission");
        return;
      }

      let verifyMetaPromise;
      if (req.p.verifyMeta) {
        verifyMetaPromise = verifyMetadataAnswersExistForEachQuestion(
          req.p.zid
        );
      } else {
        verifyMetaPromise = Promise.resolve();
      }

      let fields: ConversationType = {};
      if (!_.isUndefined(req.p.is_active)) {
        fields.is_active = req.p.is_active;
      }
      if (!_.isUndefined(req.p.is_anon)) {
        fields.is_anon = req.p.is_anon;
      }
      if (!_.isUndefined(req.p.is_draft)) {
        fields.is_draft = req.p.is_draft;
      }
      if (!_.isUndefined(req.p.is_data_open)) {
        fields.is_data_open = req.p.is_data_open;
      }
      if (!_.isUndefined(req.p.profanity_filter)) {
        fields.profanity_filter = req.p.profanity_filter;
      }
      if (!_.isUndefined(req.p.spam_filter)) {
        fields.spam_filter = req.p.spam_filter;
      }
      if (!_.isUndefined(req.p.strict_moderation)) {
        fields.strict_moderation = req.p.strict_moderation;
      }
      if (!_.isUndefined(req.p.topic)) {
        fields.topic = req.p.topic;
      }
      if (!_.isUndefined(req.p.description)) {
        fields.description = req.p.description;
      }
      if (!_.isUndefined(req.p.survey_caption)) {
        fields.survey_caption = req.p.survey_caption;
      }
      if (!_.isUndefined(req.p.postsurvey)) {
        fields.postsurvey = req.p.postsurvey;
      }
      if (!_.isUndefined(req.p.postsurvey_limit)) {
        fields.postsurvey_limit = req.p.postsurvey_limit;
      }
      if (!_.isUndefined(req.p.postsurvey_submissions)) {
        fields.postsurvey_submissions = req.p.postsurvey_submissions;
      }
      if (!_.isUndefined(req.p.postsurvey_redirect)) {
        fields.postsurvey_redirect = req.p.postsurvey_redirect;
      }
      if (!_.isUndefined(req.p.vis_type)) {
        fields.vis_type = req.p.vis_type;
      }
      if (!_.isUndefined(req.p.help_type)) {
        fields.help_type = req.p.help_type;
      }
      if (!_.isUndefined(req.p.socialbtn_type)) {
        fields.socialbtn_type = req.p.socialbtn_type;
      }
      if (!_.isUndefined(req.p.bgcolor)) {
        if (req.p.bgcolor === "default") {
          fields.bgcolor = null;
        } else {
          fields.bgcolor = req.p.bgcolor;
        }
      }
      if (!_.isUndefined(req.p.help_color)) {
        if (req.p.help_color === "default") {
          fields.help_color = null;
        } else {
          fields.help_color = req.p.help_color;
        }
      }
      if (!_.isUndefined(req.p.help_bgcolor)) {
        if (req.p.help_bgcolor === "default") {
          fields.help_bgcolor = null;
        } else {
          fields.help_bgcolor = req.p.help_bgcolor;
        }
      }
      if (!_.isUndefined(req.p.style_btn)) {
        fields.style_btn = req.p.style_btn;
      }
      if (!_.isUndefined(req.p.write_type)) {
        fields.write_type = req.p.write_type;
      }
      ifDefinedSet("auth_needed_to_vote", req.p, fields);
      ifDefinedSet("auth_needed_to_write", req.p, fields);
      ifDefinedSet("auth_opt_fb", req.p, fields);
      ifDefinedSet("auth_opt_tw", req.p, fields);
      ifDefinedSet("auth_opt_allow_3rdparty", req.p, fields);

      if (!_.isUndefined(req.p.owner_sees_participation_stats)) {
        fields.owner_sees_participation_stats =
          !!req.p.owner_sees_participation_stats;
      }
      if (!_.isUndefined(req.p.link_url)) {
        fields.link_url = req.p.link_url;
      }

      ifDefinedSet("subscribe_type", req.p, fields);

      let q = sql_conversations
        .update(fields)
        .where(sql_conversations.zid.equals(req.p.zid))
        // .and( sql_conversations.owner.equals(req.p.uid) )
        .returning("*");
      verifyMetaPromise.then(
        function () {
          pgQuery(q.toString(), function (err: any, result: { rows: any[] }) {
            if (err) {
              fail(res, 500, "polis_err_update_conversation", err);
              return;
            }
            let conv = result && result.rows && result.rows[0];
            // The first check with isModerator implictly tells us this can be returned in HTTP response.
            conv.is_mod = true;

            let promise = generateShortUrl
              ? generateAndReplaceZinvite(req.p.zid, generateShortUrl)
              : Promise.resolve();
            let successCode = generateShortUrl ? 201 : 200;

            promise
              .then(function () {
                // send notification email
                if (req.p.send_created_email) {
                  Promise.all([
                    getUserInfoForUid2(req.p.uid),
                    getConversationUrl(req, req.p.zid, true),
                  ])
                    .then(function (results: any[]) {
                      let hname = results[0].hname;
                      let url = results[1];
                      sendEmailByUid(
                        req.p.uid,
                        "Conversation created",
                        "Hi " +
                          hname +
                          ",\n" +
                          "\n" +
                          "Here's a link to the conversation you just created. Use it to invite participants to the conversation. Share it by whatever network you prefer - Gmail, Facebook, Twitter, etc., or just post it to your website or blog. Try it now! Click this link to go to your conversation:" +
                          "\n" +
                          url +
                          "\n" +
                          "\n" +
                          "With gratitude,\n" +
                          "\n" +
                          "The team\n"
                      ).catch(function (err: any) {
                        logger.error(
                          "polis_err_sending_conversation_created_email",
                          err
                        );
                      });
                    })
                    .catch(function (err: any) {
                      logger.error(
                        "polis_err_sending_conversation_created_email",
                        err
                      );
                    });
                }

                finishOne(res, conv, true, successCode);

                updateConversationModifiedTime(req.p.zid);
              })
              .catch(function (err: any) {
                fail(res, 500, "polis_err_update_conversation", err);
              });
          });
        },
        function (err: { message: any }) {
          fail(res, 500, err.message, err);
        }
      );
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_update_conversation", err);
    });
}

function handle_DELETE_metadata_questions(
  req: { p: { uid?: any; pmqid: any } },
  res: { send: (arg0: number) => void }
) {
  let uid = req.p.uid;
  let pmqid = req.p.pmqid;

  getZidForQuestion(pmqid, function (err: any, zid: any) {
    if (err) {
      fail(
        res,
        500,
        "polis_err_delete_participant_metadata_questions_zid",
        err
      );
      return;
    }
    isConversationOwner(zid, uid, function (err: any) {
      if (err) {
        fail(
          res,
          403,
          "polis_err_delete_participant_metadata_questions_auth",
          err
        );
        return;
      }

      deleteMetadataQuestionAndAnswers(pmqid, function (err?: string | null) {
        if (err) {
          fail(
            res,
            500,
            "polis_err_delete_participant_metadata_question",
            new Error(err)
          );
          return;
        }
        res.send(200);
      });
    });
  });
}

function handle_DELETE_metadata_answers(
  req: { p: { uid?: any; pmaid: any } },
  res: { send: (arg0: number) => void }
) {
  let uid = req.p.uid;
  let pmaid = req.p.pmaid;

  getZidForAnswer(pmaid, function (err: any, zid: any) {
    if (err) {
      fail(
        res,
        500,
        "polis_err_delete_participant_metadata_answers_zid",
        err
      );
      return;
    }
    isConversationOwner(zid, uid, function (err: any) {
      if (err) {
        fail(
          res,
          403,
          "polis_err_delete_participant_metadata_answers_auth",
          err
        );
        return;
      }

      deleteMetadataAnswer(pmaid, function (err: any) {
        if (err) {
          fail(
            res,
            500,
            "polis_err_delete_participant_metadata_answers",
            err
          );
          return;
        }
        res.send(200);
      });
    });
  });
}

function getZidForAnswer(
  pmaid: any,
  callback: {
    (err: any, zid: any): void;
    (arg0: string | null, arg1?: undefined): void;
  }
) {
  pgQuery(
    "SELECT zid FROM participant_metadata_answers WHERE pmaid = ($1);",
    [pmaid],
    function (err: any, result: { rows: string | any[] }) {
      if (err) {
        callback(err);
        return;
      }
      if (!result.rows || !result.rows.length) {
        callback("polis_err_zid_missing_for_answer");
        return;
      }
      callback(null, result.rows[0].zid);
    }
  );
}

function getZidForQuestion(
  pmqid: any,
  callback: {
    (err: any, zid?: any): void;
    (arg0: string | null, arg1: undefined): void;
  }
) {
  pgQuery(
    "SELECT zid FROM participant_metadata_questions WHERE pmqid = ($1);",
    [pmqid],
    function (err: any, result: { rows: string | any[] }) {
      if (err) {
        logger.error("polis_err_zid_missing_for_question", err);
        callback(err);
        return;
      }
      if (!result.rows || !result.rows.length) {
        callback("polis_err_zid_missing_for_question");
        return;
      }
      callback(null, result.rows[0].zid);
    }
  );
}

function deleteMetadataAnswer(
  pmaid: any,
  callback: { (err: any): void; (arg0: null): void }
) {
  // pgQuery("update participant_metadata_choices set alive = FALSE where pmaid = ($1);", [pmaid], function(err) {
  //     if (err) {callback(34534545); return;}
  pgQuery(
    "update participant_metadata_answers set alive = FALSE where pmaid = ($1);",
    [pmaid],
    function (err: any) {
      if (err) {
        callback(err);
        return;
      }
      callback(null);
    }
  );
  // });
}

function deleteMetadataQuestionAndAnswers(
  pmqid: any,
  callback: { (err: any): void; (arg0: null): void }
) {
  // pgQuery("update participant_metadata_choices set alive = FALSE where pmqid = ($1);", [pmqid], function(err) {
  //     if (err) {callback(93847834); return;}
  pgQuery(
    "update participant_metadata_answers set alive = FALSE where pmqid = ($1);",
    [pmqid],
    function (err: any) {
      if (err) {
        callback(err);
        return;
      }
      pgQuery(
        "update participant_metadata_questions set alive = FALSE where pmqid = ($1);",
        [pmqid],
        function (err: any) {
          if (err) {
            callback(err);
            return;
          }
          callback(null);
        }
      );
    }
  );
  // });
}

function handle_GET_metadata_questions(
  req: { p: { zid: any; zinvite: any; suzinvite: any } },
  res: any
) {
  let zid = req.p.zid;
  let zinvite = req.p.zinvite;
  let suzinvite = req.p.suzinvite;

  function doneChecking(err: boolean) {
    if (err) {
      fail(res, 403, "polis_err_get_participant_metadata_auth", err);
      return;
    }

    //     No overload matches this call.
    // Overload 1 of 3, '(tasks: AsyncFunction<{ rows: any; }, any>[], callback?: AsyncResultArrayCallback<{ rows: any; }, any> | undefined): void', gave the following error.
    //   Argument of type '(err: any, result: { rows: any; }[]) => void' is not assignable to parameter of type 'AsyncResultArrayCallback<{ rows: any; }, any>'.
    //     Types of parameters 'result' and 'results' are incompatible.
    //       Type '({ rows: any; } | undefined)[] | undefined' is not assignable to type '{ rows: any; }[]'.
    //         Type 'undefined' is not assignable to type '{ rows: any; }[]'.
    // Overload 2 of 3, '(tasks: Dictionary<AsyncFunction<unknown, any>>, callback?: AsyncResultObjectCallback<unknown, any> | undefined): void', gave the following error.
    //   Argument of type '((callback: any) => void)[]' is not assignable to parameter of type 'Dictionary<AsyncFunction<unknown, any>>'.
    //     Index signature is missing in type '((callback: any) => void)[]'.ts(2769)
    // @ts-ignore
    async.parallel(
      [
        function (callback: any) {
          pgQuery_readOnly(
            "SELECT * FROM participant_metadata_questions WHERE alive = true AND zid = ($1);",
            [zid],
            callback
          );
        },
        //function(callback) { pgQuery_readOnly("SELECT * FROM participant_metadata_answers WHERE alive = true AND zid = ($1);", [zid], callback); },
        //function(callback) { pgQuery_readOnly("SELECT * FROM participant_metadata_choices WHERE alive = true AND zid = ($1);", [zid], callback); },
      ],
      function (err: any, result: { rows: any }[]) {
        if (err) {
          fail(res, 500, "polis_err_get_participant_metadata_questions", err);
          return;
        }
        let rows = result[0] && result[0].rows;
        rows = rows.map(function (r: { required: boolean }) {
          r.required = true;
          return r;
        });
        finishArray(res, rows);
      }
    );
  }

  if (zinvite) {
    //       (local function) doneChecking(err: boolean, foo?: undefined): void
    // Argument of type '(err: boolean, foo?: undefined) => void' is not assignable to parameter of type '{ (err: any, foo: any): void; (err: any, foo: any): void; (err: any): void; (arg0: number | null): void; }'.
    //   Types of parameters 'err' and 'arg0' are incompatible.
    //     Type 'number | null' is not assignable to type 'boolean'.
    //         Type 'null' is not assignable to type 'boolean'.ts(2345)
    // @ts-ignore
    checkZinviteCodeValidity(zid, zinvite, doneChecking);
  } else if (suzinvite) {
    //       (local function) checkSuzinviteCodeValidity(zid: any, suzinvite: any, callback: {
    //     (err: any, foo: any): void;
    //     (err: any, foo: any): void;
    //     (err: any): void;
    //     (arg0: number | null): void;
    // }): void
    // Argument of type '(err: boolean, foo?: undefined) => void' is not assignable to parameter of type '{ (err: any, foo: any): void; (err: any, foo: any): void; (err: any): void; (arg0: number | null): void; }'.
    //   Types of parameters 'err' and 'arg0' are incompatible.
    //       Type 'number | null' is not assignable to type 'boolean'.ts(2345)
    // @ts-ignore
    checkSuzinviteCodeValidity(zid, suzinvite, doneChecking);
  } else {
    doneChecking(false);
  }
}

function handle_POST_metadata_questions(
  req: { p: { zid: any; key: any; uid?: any } },
  res: any
) {
  let zid = req.p.zid;
  let key = req.p.key;
  let uid = req.p.uid;

  function doneChecking(err: any) {
    if (err) {
      fail(res, 403, "polis_err_post_participant_metadata_auth", err);
      return;
    }
    pgQuery(
      "INSERT INTO participant_metadata_questions (pmqid, zid, key) VALUES (default, $1, $2) RETURNING *;",
      [zid, key],
      function (err: any, results: { rows: string | any[] }) {
        if (err || !results || !results.rows || !results.rows.length) {
          fail(res, 500, "polis_err_post_participant_metadata_key", err);
          return;
        }

        finishOne(res, results.rows[0]);
      }
    );
  }

  isConversationOwner(zid, uid, doneChecking);
}

function handle_POST_metadata_answers(
  req: { p: { zid: any; uid?: any; pmqid: any; value: any } },
  res: any
) {
  let zid = req.p.zid;
  let uid = req.p.uid;
  let pmqid = req.p.pmqid;
  let value = req.p.value;

  function doneChecking(err: any) {
    if (err) {
      fail(res, 403, "polis_err_post_participant_metadata_auth", err);
      return;
    }
    pgQuery(
      "INSERT INTO participant_metadata_answers (pmqid, zid, value, pmaid) VALUES ($1, $2, $3, default) RETURNING *;",
      [pmqid, zid, value],
      function (err: any, results: { rows: string | any[] }) {
        if (err || !results || !results.rows || !results.rows.length) {
          pgQuery(
            "UPDATE participant_metadata_answers set alive = TRUE where pmqid = ($1) AND zid = ($2) AND value = ($3) RETURNING *;",
            [pmqid, zid, value],
            function (err: any, results: { rows: any[] }) {
              if (err) {
                fail(
                  res,
                  500,
                  "polis_err_post_participant_metadata_value",
                  err
                );
                return;
              }
              finishOne(res, results.rows[0]);
            }
          );
        } else {
          finishOne(res, results.rows[0]);
        }
      }
    );
  }

  isConversationOwner(zid, uid, doneChecking);
}

function handle_GET_metadata_choices(req: { p: { zid: any } }, res: any) {
  let zid = req.p.zid;

  getChoicesForConversation(zid).then(
    function (choices: any) {
      finishArray(res, choices);
    },
    function (err: any) {
      fail(res, 500, "polis_err_get_participant_metadata_choices", err);
    }
  );
}
function handle_GET_metadata_answers(
  req: { p: { zid: any; zinvite: any; suzinvite: any; pmqid: any } },
  res: any
) {
  let zid = req.p.zid;
  let zinvite = req.p.zinvite;
  let suzinvite = req.p.suzinvite;
  let pmqid = req.p.pmqid;

  function doneChecking(err: boolean) {
    if (err) {
      fail(res, 403, "polis_err_get_participant_metadata_auth", err);
      return;
    }
    let query = sql_participant_metadata_answers
      .select(sql_participant_metadata_answers.star())
      .where(sql_participant_metadata_answers.zid.equals(zid))
      .and(sql_participant_metadata_answers.alive.equals(true));

    if (pmqid) {
      query = query.where(
        sql_participant_metadata_answers.pmqid.equals(pmqid)
      );
    }
    pgQuery_readOnly(
      query.toString(),
      function (err: any, result: { rows: any[] }) {
        if (err) {
          fail(res, 500, "polis_err_get_participant_metadata_answers", err);
          return;
        }
        let rows = result.rows.map(function (r: { is_exclusive: boolean }) {
          r.is_exclusive = true; // TODO fetch this info from the queston itself
          return r;
        });
        finishArray(res, rows);
      }
    );
  }

  if (zinvite) {
    //       (local function) doneChecking(err: boolean, foo?: undefined): void
    // Argument of type '(err: boolean, foo?: undefined) => void' is not assignable to parameter of type '{ (err: any, foo: any): void; (err: any, foo: any): void; (err: any): void; (arg0: number | null): void; }'.
    //   Types of parameters 'err' and 'arg0' are incompatible.
    //         Type 'number | null' is not assignable to type 'boolean'.ts(2345)
    // @ts-ignore
    checkZinviteCodeValidity(zid, zinvite, doneChecking);
  } else if (suzinvite) {
    //       (local function) doneChecking(err: boolean, foo?: undefined): void
    // Argument of type '(err: boolean, foo?: undefined) => void' is not assignable to parameter of type '{ (err: any, foo: any): void; (err: any, foo: any): void; (err: any): void; (arg0: number | null): void; }'.
    //   Types of parameters 'err' and 'arg0' are incompatible.
    //     Type 'number | null' is not assignable to type 'boolean'.ts(2345)
    // @ts-ignore
    checkSuzinviteCodeValidity(zid, suzinvite, doneChecking);
  } else {
    doneChecking(false);
  }
}
function handle_GET_metadata(
  req: { p: { zid: any; zinvite: any; suzinvite: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: {
        (arg0: { kvp?: {}; keys?: {}; values?: {} }): void;
        new (): any;
      };
    };
  }
) {
  let zid = req.p.zid;
  let zinvite = req.p.zinvite;
  let suzinvite = req.p.suzinvite;

  function doneChecking(err: boolean) {
    if (err) {
      fail(res, 403, "polis_err_get_participant_metadata_auth", err);
      return;
    }

    //     No overload matches this call.
    // Overload 1 of 3, '(tasks: AsyncFunction<{ rows: any; }, any>[], callback?: AsyncResultArrayCallback<{ rows: any; }, any> | undefined): void', gave the following error.
    //   Argument of type '(err: any, result: { rows: any; }[]) => void' is not assignable to parameter of type 'AsyncResultArrayCallback<{ rows: any; }, any>'.
    //     Types of parameters 'result' and 'results' are incompatible.
    //       Type '({ rows: any; } | undefined)[] | undefined' is not assignable to type '{ rows: any; }[]'.
    //         Type 'undefined' is not assignable to type '{ rows: any; }[]'.
    // Overload 2 of 3, '(tasks: Dictionary<AsyncFunction<unknown, any>>, callback?: AsyncResultObjectCallback<unknown, any> | undefined): void', gave the following error.
    //   Argument of type '((callback: any) => void)[]' is not assignable to parameter of type 'Dictionary<AsyncFunction<unknown, any>>'.
    //     Index signature is missing in type '((callback: any) => void)[]'.ts(2769)
    // @ts-ignore
    async.parallel(
      [
        function (callback: any) {
          pgQuery_readOnly(
            "SELECT * FROM participant_metadata_questions WHERE zid = ($1);",
            [zid],
            callback
          );
        },
        function (callback: any) {
          pgQuery_readOnly(
            "SELECT * FROM participant_metadata_answers WHERE zid = ($1);",
            [zid],
            callback
          );
        },
        function (callback: any) {
          pgQuery_readOnly(
            "SELECT * FROM participant_metadata_choices WHERE zid = ($1);",
            [zid],
            callback
          );
        },
      ],
      function (err: any, result: { rows: any }[]) {
        if (err) {
          fail(res, 500, "polis_err_get_participant_metadata", err);
          return;
        }
        let keys = result[0] && result[0].rows;
        let vals = result[1] && result[1].rows;
        let choices = result[2] && result[2].rows;
        let o = {};
        let keyNames = {};
        let valueNames = {};
        let i;
        let k;
        let v;
        if (!keys || !keys.length) {
          res.status(200).json({});
          return;
        }
        for (i = 0; i < keys.length; i++) {
          // Add a map for each keyId
          k = keys[i];
          // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
          // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
          // @ts-ignore
          o[k.pmqid] = {};
          // keep the user-facing key name
          // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
          // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
          // @ts-ignore
          keyNames[k.pmqid] = k.key;
        }
        for (i = 0; i < vals.length; i++) {
          // Add an array for each possible valueId
          k = vals[i];
          v = vals[i];
          // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
          // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
          // @ts-ignore
          o[k.pmqid][v.pmaid] = [];
          // keep the user-facing value string
          // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
          // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
          // @ts-ignore
          valueNames[v.pmaid] = v.value;
        }
        for (i = 0; i < choices.length; i++) {
          // Append a pid for each person who has seleted that value for that key.
          // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
          // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
          // @ts-ignore
          o[choices[i].pmqid][choices[i].pmaid] = choices[i].pid;
        }
        // TODO cache
        res.status(200).json({
          kvp: o, // key_id => value_id => [pid]
          keys: keyNames,
          values: valueNames,
        });
      }
    );
  }

  if (zinvite) {
    //       (local function) doneChecking(err: boolean): void
    // Argument of type '(err: boolean) => void' is not assignable to parameter of type '{ (err: any, foo: any): void; (err: any, foo: any): void; (err: any): void; (arg0: number | null): void; }'.
    //   Types of parameters 'err' and 'arg0' are incompatible.
    //         Type 'number | null' is not assignable to type 'boolean'.ts(2345)
    // @ts-ignore
    checkZinviteCodeValidity(zid, zinvite, doneChecking);
  } else if (suzinvite) {
    //       (local function) doneChecking(err: boolean): void
    // Argument of type '(err: boolean) => void' is not assignable to parameter of type '{ (err: any, foo: any): void; (err: any, foo: any): void; (err: any): void; (arg0: number | null): void; }'.
    //   Types of parameters 'err' and 'arg0' are incompatible.
    //         Type 'number | null' is not assignable to type 'boolean'.ts(2345)
    // @ts-ignore
    checkSuzinviteCodeValidity(zid, suzinvite, doneChecking);
  } else {
    doneChecking(false);
  }
}
function getConversationHasMetadata(zid: any) {
  return new Promise(function (
    resolve: (arg0: boolean) => void,
    reject: (arg0: string) => any
  ) {
    pgQuery_readOnly(
      "SELECT * from participant_metadata_questions where zid = ($1)",
      [zid],
      function (err: any, metadataResults: { rows: string | any[] }) {
        if (err) {
          return reject("polis_err_get_conversation_metadata_by_zid");
        }
        let hasNoMetadata =
          !metadataResults ||
          !metadataResults.rows ||
          !metadataResults.rows.length;
        resolve(!hasNoMetadata);
      }
    );
  });
}

function getConversationTranslations(zid: any, lang: string) {
  const firstTwoCharsOfLang = lang.substr(0, 2);
  return pgQueryP(
    "select * from conversation_translations where zid = ($1) and lang = ($2);",
    [zid, firstTwoCharsOfLang]
  );
}

function getConversationTranslationsMinimal(zid: any, lang: any) {
  if (!lang) {
    return Promise.resolve([]);
  }
  return getConversationTranslations(zid, lang).then(function (
    rows: string | any[]
  ) {
    for (let i = 0; i < rows.length; i++) {
      delete rows[i].zid;
      delete rows[i].created;
      delete rows[i].modified;
      delete rows[i].src;
    }
    return rows;
  });
}

function getOneConversation(zid: any, uid?: any, lang?: null) {
  return Promise.all([
    pgQueryP_readOnly(
      "select * from conversations left join  (select uid, site_id from users) as u on conversations.owner = u.uid where conversations.zid = ($1);",
      [zid]
    ),
    getConversationHasMetadata(zid),
    _.isUndefined(uid) ? Promise.resolve({}) : getUserInfoForUid2(uid),
    getConversationTranslationsMinimal(zid, lang),
  ]).then(function (results: any[]) {
    let conv = results[0] && results[0][0];
    let convHasMetadata = results[1];
    let requestingUserInfo = results[2];
    let translations = results[3];

    conv.auth_opt_allow_3rdparty = ifDefinedFirstElseSecond(
      conv.auth_opt_allow_3rdparty,
      true
    );
    conv.auth_opt_fb_computed =
      conv.auth_opt_allow_3rdparty &&
      ifDefinedFirstElseSecond(conv.auth_opt_fb, true);
    conv.auth_opt_tw_computed =
      conv.auth_opt_allow_3rdparty &&
      ifDefinedFirstElseSecond(conv.auth_opt_tw, true);

    conv.translations = translations;

    return getUserInfoForUid2(conv.owner).then(function (ownerInfo: any) {
      let ownername = ownerInfo.hname;
      if (convHasMetadata) {
        conv.hasMetadata = true;
      }
      if (!_.isUndefined(ownername) && conv.context !== "hongkong2014") {
        conv.ownername = ownername;
      }
      conv.is_mod = conv.site_id === requestingUserInfo.site_id;
      conv.is_owner = conv.owner === uid;
      delete conv.uid; // conv.owner is what you want, uid shouldn't be returned.
      return conv;
    });
  });
}

function getConversations(
  req: {
    p: ConversationType;
  },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: any): void; new (): any };
    };
  }
) {
  let uid = req.p.uid;
  let zid = req.p.zid;
  let xid = req.p.xid;
  // let course_invite = req.p.course_invite;
  let include_all_conversations_i_am_in =
    req.p.include_all_conversations_i_am_in;
  let want_mod_url = req.p.want_mod_url;
  let want_upvoted = req.p.want_upvoted;
  let want_inbox_item_admin_url = req.p.want_inbox_item_admin_url;
  let want_inbox_item_participant_url = req.p.want_inbox_item_participant_url;
  let want_inbox_item_admin_html = req.p.want_inbox_item_admin_html;
  let want_inbox_item_participant_html =
    req.p.want_inbox_item_participant_html;

  // this statement is currently a subset of the next one
  // let zidListQuery = "select zid from page_ids where site_id = (select site_id from users where uid = ($1))";

  // include conversations started by people with the same site_id as me
  // 1's indicate that the conversations are there for that reason
  let zidListQuery =
    "select zid, 1 as type from conversations where owner in (select uid from users where site_id = (select site_id from users where uid = ($1)))";
  if (include_all_conversations_i_am_in) {
    zidListQuery +=
      " UNION ALL select zid, 2 as type from participants where uid = ($1)"; // using UNION ALL instead of UNION to ensure we get all the 1's and 2's (I'm not sure if we can guarantee the 2's won't clobber some 1's if we use UNION)
  }
  zidListQuery += ";";
  pgQuery_readOnly(
    zidListQuery,
    [uid],
    function (err: any, results: { rows: any }) {
      if (err) {
        fail(res, 500, "polis_err_get_conversations_participated_in", err);
        return;
      }

      let participantInOrSiteAdminOf =
        (results && results.rows && _.pluck(results.rows, "zid")) || null;
      let siteAdminOf = _.filter(
        results.rows,
        function (row: { type: number }) {
          return row.type === 1;
        }
      );
      let isSiteAdmin = _.indexBy(siteAdminOf, "zid");

      let query = sql_conversations.select(sql_conversations.star());

      let isRootsQuery = false;
      let orClauses;
      if (!_.isUndefined(req.p.context)) {
        if (req.p.context === "/") {
          // root of roots returns all public conversations
          // TODO lots of work to decide what's relevant
          // There is a bit of mess here, because we're returning both public 'roots' conversations, and potentially private conversations that you are already in.
          orClauses = sql_conversations.is_public.equals(true);
          isRootsQuery = true; // more conditions follow in the ANDs below
        } else {
          // knowing a context grants access to those conversations (for now at least)
          orClauses = sql_conversations.context.equals(req.p.context);
        }
      } else {
        orClauses = sql_conversations.owner.equals(uid);
        if (participantInOrSiteAdminOf.length) {
          orClauses = orClauses.or(
            sql_conversations.zid.in(participantInOrSiteAdminOf)
          );
        }
      }
      query = query.where(orClauses);
      if (!_.isUndefined(req.p.course_invite)) {
        query = query.and(
          sql_conversations.course_id.equals(req.p.course_id)
        );
      }
      // query = query.where("("+ or_clauses.join(" OR ") + ")");
      if (!_.isUndefined(req.p.is_active)) {
        query = query.and(
          sql_conversations.is_active.equals(req.p.is_active)
        );
      }
      if (!_.isUndefined(req.p.is_draft)) {
        query = query.and(sql_conversations.is_draft.equals(req.p.is_draft));
      }
      if (!_.isUndefined(req.p.zid)) {
        query = query.and(sql_conversations.zid.equals(zid));
      }
      if (isRootsQuery) {
        query = query.and(sql_conversations.context.isNotNull());
      }

      //query = whereOptional(query, req.p, 'owner');
      query = query.order(sql_conversations.created.descending);

      if (!_.isUndefined(req.p.limit)) {
        query = query.limit(req.p.limit);
      } else {
        query = query.limit(999); // TODO paginate
      }
      pgQuery_readOnly(
        query.toString(),
        function (err: any, result: { rows: never[] }) {
          if (err) {
            fail(res, 500, "polis_err_get_conversations", err);
            return;
          }
          let data = result.rows || [];
          addConversationIds(data)
            .then(function (data: any[]) {
              let suurlsPromise;
              if (xid) {
                suurlsPromise = Promise.all(
                  data.map(function (conv: { zid: any; owner: any }) {
                    return createOneSuzinvite(
                      xid,
                      conv.zid,
                      conv.owner, // TODO think: conv.owner or uid?
                      _.partial(generateSingleUseUrl, req)
                    );
                  })
                );
              } else {
                suurlsPromise = Promise.resolve([]);
              }
              let upvotesPromise =
                uid && want_upvoted
                  ? pgQueryP_readOnly(
                      "select zid from upvotes where uid = ($1);",
                      [uid]
                    )
                  : Promise.resolve([]);

              return Promise.all([suurlsPromise, upvotesPromise]).then(
                function ([suurlData_, upvotes_]) {
                  const suurlData = _.indexBy(suurlData_, "zid");
                  const upvotes = _.indexBy(upvotes_, "zid");

                  data.forEach(function (conv: {
                    is_owner: boolean;
                    is_archived: boolean;
                    owner: any;
                    mod_url: string;
                    conversation_id: string;
                    inbox_item_admin_url: string;
                    inbox_item_participant_url: string;
                    inbox_item_admin_html: string;
                    topic: string;
                    created: string | number | Date;
                    inbox_item_admin_html_escaped: any;
                    inbox_item_participant_html: string;
                    inbox_item_participant_html_escaped: any;
                    url: string;
                    upvoted: boolean;
                    modified: number;
                    is_mod: any;
                    is_anon: any;
                    is_active: any;
                    is_draft: any;
                    is_public: any;
                    zid?: string | number;
                    context?: string;
                  }) {
                    conv.is_owner = conv.owner === uid;
                    let root = getServerNameWithProtocol(req);

                    if (want_mod_url) {
                      // TODO make this into a moderation invite URL so others can join Issue #618
                      conv.mod_url = createModerationUrl(
                        req,
                        conv.conversation_id
                      );
                    }
                    if (want_inbox_item_admin_url) {
                      conv.inbox_item_admin_url =
                        root + "/iim/" + conv.conversation_id;
                    }
                    if (want_inbox_item_participant_url) {
                      conv.inbox_item_participant_url =
                        root + "/iip/" + conv.conversation_id;
                    }
                    if (want_inbox_item_admin_html) {
                      conv.inbox_item_admin_html =
                        "<a href='" +
                        root +
                        "/" +
                        conv.conversation_id +
                        "'>" +
                        (conv.topic || conv.created) +
                        "</a>" +
                        " <a href='" +
                        root +
                        "/m/" +
                        conv.conversation_id +
                        "'>moderate</a>";

                      conv.inbox_item_admin_html_escaped =
                        conv.inbox_item_admin_html.replace(/'/g, "\\'");
                    }
                    if (want_inbox_item_participant_html) {
                      conv.inbox_item_participant_html =
                        "<a href='" +
                        root +
                        "/" +
                        conv.conversation_id +
                        "'>" +
                        (conv.topic || conv.created) +
                        "</a>";
                      conv.inbox_item_participant_html_escaped =
                        conv.inbox_item_admin_html.replace(/'/g, "\\'");
                    }

                    if (suurlData) {
                      conv.url = suurlData[conv.zid || ""].suurl;
                    } else {
                      conv.url = buildConversationUrl(
                        req,
                        conv.conversation_id
                      );
                    }
                    if (upvotes && upvotes[conv.zid || ""]) {
                      conv.upvoted = true;
                    }
                    conv.created = Number(conv.created);
                    conv.modified = Number(conv.modified);

                    // if there is no topic, provide a UTC timstamp instead
                    if (_.isUndefined(conv.topic) || conv.topic === "") {
                      conv.topic = new Date(conv.created).toUTCString();
                    }

                    conv.is_mod =
                      conv.is_owner || isSiteAdmin[conv.zid || ""];

                    // Make sure zid is not exposed
                    delete conv.zid;

                    delete conv.is_anon;
                    delete conv.is_draft;
                    delete conv.is_public;
                    if (conv.context === "") {
                      delete conv.context;
                    }
                  });

                  res.status(200).json(data);
                },
                function (err: any) {
                  fail(res, 500, "polis_err_get_conversations_surls", err);
                }
              );
            })
            .catch(function (err: any) {
              fail(res, 500, "polis_err_get_conversations_misc", err);
            });
        }
      );
    }
  );
}

function createReport(zid: any) {
  //   Argument of type '(report_id: string) => Promise<unknown>' is not assignable to parameter of type '(value: unknown) => unknown'.
  // Types of parameters 'report_id' and 'value' are incompatible.
  //     Type 'unknown' is not assignable to type 'string'.ts(2345)
  // @ts-ignore
  return generateTokenP(20, false).then(function (report_id: string) {
    report_id = "r" + report_id;
    return pgQueryP("insert into reports (zid, report_id) values ($1, $2);", [
      zid,
      report_id,
    ]);
  });
}
function handle_POST_reports(
  req: { p: { zid: any; uid?: any } },
  res: { json: (arg0: {}) => void }
) {
  let zid = req.p.zid;
  let uid = req.p.uid;

  return (
    isModerator(zid, uid)
      // Argument of type '(isMod: any, err: string) => void | globalThis.Promise<void>' is not assignable to parameter of type '(value: unknown) => void | PromiseLike<void>'.ts(2345)
      // @ts-ignore
      .then((isMod: any, err: string) => {
        if (!isMod) {
          return fail(res, 403, "polis_err_post_reports_permissions", err);
        }
        return createReport(zid).then(() => {
          res.json({});
        });
      })
      .catch((err: any) => {
        fail(res, 500, "polis_err_post_reports_misc", err);
      })
  );
}
function handle_PUT_reports(
  req: {
    p: { [x: string]: any; rid: any; uid?: any; zid: any; report_name: any };
  },
  res: { json: (arg0: {}) => void }
) {
  let rid = req.p.rid;
  let uid = req.p.uid;
  let zid = req.p.zid;

  return (
    isModerator(zid, uid)
      // Argument of type '(isMod: any, err: string) => void | globalThis.Promise<void>' is not assignable to parameter of type '(value: unknown) => void | PromiseLike<void>'.ts(2345)
      // @ts-ignore
      .then((isMod: any, err: string) => {
        if (!isMod) {
          return fail(res, 403, "polis_err_put_reports_permissions", err);
        }

        let fields: { [key: string]: string } = {
          modified: "now_as_millis()",
        };

        sql_reports.columns
          .map((c: { name: any }) => {
            return c.name;
          })
          .filter((name: string) => {
            // only allow changing label fields, (label_x_neg, etc) not zid, etc.
            return name.startsWith("label_");
          })
          .forEach((name: string | number) => {
            if (!_.isUndefined(req.p[name])) {
              fields[name] = req.p[name];
            }
          });

        if (!_.isUndefined(req.p.report_name)) {
          fields.report_name = req.p.report_name;
        }

        let q = sql_reports.update(fields).where(sql_reports.rid.equals(rid));

        let query = q.toString();
        query = query.replace("'now_as_millis()'", "now_as_millis()"); // remove quotes added by sql lib

        return pgQueryP(query, []).then(() => {
          res.json({});
        });
      })
      .catch((err: any) => {
        fail(res, 500, "polis_err_post_reports_misc", err);
      })
  );
}
function handle_GET_reports(
  req: { p: { zid: any; rid: any; uid?: any } },
  res: { json: (arg0: any) => void }
) {
  let zid = req.p.zid;
  let rid = req.p.rid;
  let uid = req.p.uid;

  let reportsPromise = null;

  if (rid) {
    if (zid) {
      reportsPromise = Promise.reject(
        "polis_err_get_reports_should_not_specify_both_report_id_and_conversation_id"
      );
    } else {
      reportsPromise = pgQueryP("select * from reports where rid = ($1);", [
        rid,
      ]);
    }
  } else if (zid) {
    reportsPromise = isModerator(zid, uid).then(
      (doesOwnConversation: any) => {
        if (!doesOwnConversation) {
          throw "polis_err_permissions";
        }
        return pgQueryP("select * from reports where zid = ($1);", [zid]);
      }
    );
  } else {
    reportsPromise = pgQueryP(
      "select * from reports where zid in (select zid from conversations where owner = ($1));",
      [uid]
    );
  }

  reportsPromise
    //     Argument of type '(reports: any[]) => void | globalThis.Promise<void>' is not assignable to parameter of type '(value: unknown) => void | PromiseLike<void>'.
    // Types of parameters 'reports' and 'value' are incompatible.
    //     Type 'unknown' is not assignable to type 'any[]'.ts(2345)
    // @ts-ignore
    .then((reports: any[]) => {
      let zids: any[] = [];
      reports = reports.map((report: { zid: any; rid: any }) => {
        zids.push(report.zid);
        delete report.rid;
        return report;
      });

      if (zids.length === 0) {
        return res.json(reports);
      }
      return pgQueryP(
        "select * from zinvites where zid in (" + zids.join(",") + ");",
        []
      ).then((zinvite_entries: any) => {
        let zidToZinvite = _.indexBy(zinvite_entries, "zid");
        reports = reports.map(
          (report: { conversation_id: any; zid?: string | number }) => {
            report.conversation_id = zidToZinvite[report.zid || ""]?.zinvite;
            delete report.zid;
            return report;
          }
        );
        res.json(reports);
      });
    })
    .catch((err: string) => {
      if (err === "polis_err_permissions") {
        fail(res, 403, "polis_err_permissions");
      } else if (
        err ===
        "polis_err_get_reports_should_not_specify_both_report_id_and_conversation_id"
      ) {
        fail(
          res,
          404,
          "polis_err_get_reports_should_not_specify_both_report_id_and_conversation_id"
        );
      } else {
        fail(res, 500, "polis_err_get_reports_misc", err);
      }
    });
}

function handle_GET_conversations(
  req: {
    p: ConversationType;
  },
  res: any
) {
  let courseIdPromise = Promise.resolve();
  if (req.p.course_invite) {
    // Type 'Promise<void>' is missing the following properties from type 'Bluebird<void>': caught, error, lastly, bind, and 38 more.ts(2740)
    // @ts-ignore
    courseIdPromise = pgQueryP_readOnly(
      "select course_id from courses where course_invite = ($1);",
      [req.p.course_invite]
      //       Argument of type '(rows: { course_id: any; }[]) => any' is not assignable to parameter of type '(value: unknown) => any'.
      // Types of parameters 'rows' and 'value' are incompatible.
      //   Type 'unknown' is not assignable to type '{ course_id: any; }[]'.ts(2345)
      // @ts-ignore
    ).then(function (rows: { course_id: any }[]) {
      return rows[0].course_id;
    });
  }
  courseIdPromise.then(function (course_id: any) {
    if (course_id) {
      req.p.course_id = course_id;
    }
    let lang = null; // for now just return the default
    if (req.p.zid) {
      getOneConversation(req.p.zid, req.p.uid, lang)
        .then(
          function (data: any) {
            finishOne(res, data);
          },
          function (err: any) {
            fail(res, 500, "polis_err_get_conversations_2", err);
          }
        )
        .catch(function (err: any) {
          fail(res, 500, "polis_err_get_conversations_1", err);
        });
    } else if (req.p.uid || req.p.context) {
      getConversations(req, res);
    } else {
      fail(res, 403, "polis_err_need_auth");
    }
  });
}

function handle_GET_contexts(
  req: any,
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: any): void; new (): any };
    };
  }
) {
  pgQueryP_readOnly(
    "select name from contexts where is_public = TRUE order by name;",
    []
  )
    .then(
      function (contexts: any) {
        res.status(200).json(contexts);
      },
      function (err: any) {
        fail(res, 500, "polis_err_get_contexts_query", err);
      }
    )
    .catch(function (err: any) {
      fail(res, 500, "polis_err_get_contexts_misc", err);
    });
}

function handle_POST_contexts(
  req: { p: { uid?: any; name: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: {}): void; new (): any };
    };
  }
) {
  let uid = req.p.uid;
  let name = req.p.name;

  function createContext() {
    return pgQueryP(
      "insert into contexts (name, creator, is_public) values ($1, $2, $3);",
      [name, uid, true]
    )
      .then(
        function () {
          res.status(200).json({});
        },
        function (err: any) {
          fail(res, 500, "polis_err_post_contexts_query", err);
        }
      )
      .catch(function (err: any) {
        fail(res, 500, "polis_err_post_contexts_misc", err);
      });
  }
  pgQueryP("select name from contexts where name = ($1);", [name])
    .then(
      function (rows: string | any[]) {
        let exists = rows && rows.length;
        if (exists) {
          fail(res, 422, "polis_err_post_context_exists");
          return;
        }
        return createContext();
      },
      function (err: any) {
        fail(res, 500, "polis_err_post_contexts_check_query", err);
      }
    )
    .catch(function (err: any) {
      fail(res, 500, "polis_err_post_contexts_check_misc", err);
    });
}
function isUserAllowedToCreateConversations(
  uid?: any,
  callback?: {
    (err: any, isAllowed: any): void;
    (err: any, isAllowed: any): void;
    (arg0: null, arg1: boolean): void;
  }
) {
  callback?.(null, true);
  // pgQuery("select is_owner from users where uid = ($1);", [uid], function(err, results) {
  //     if (err) { return callback(err); }
  //     if (!results || !results.rows || !results.rows.length) {
  //         return callback(1);
  //     }
  //     callback(null, results.rows[0].is_owner);
  // });
}

function handle_POST_reserve_conversation_id(
  req: any,
  res: { json: (arg0: { conversation_id: any }) => void }
) {
  const zid = 0;
  const shortUrl = false;
  // TODO check auth - maybe bot has key
  generateAndRegisterZinvite(zid, shortUrl)
    .then(function (conversation_id: any) {
      res.json({
        conversation_id: conversation_id,
      });
    })
    .catch((err: any) => {
      fail(res, 500, "polis_err_reserve_conversation_id", err);
    });
}
function handle_POST_conversations(
  req: {
    p: {
      context: any;
      short_url: any;
      uid?: any;
      org_id: any;
      topic: any;
      description: any;
      survey_caption: any;
      postsurvey: any;
      postsurvey_limit: any;
      postsurvey_submissions: any;
      postsurvey_redirect: any;
      is_active: any;
      is_data_open: any;
      is_draft: any;
      is_anon: any;
      profanity_filter: any;
      spam_filter: any;
      strict_moderation: any;
      owner_sees_participation_stats: any;
      auth_needed_to_vote: any;
      auth_needed_to_write: any;
      auth_opt_allow_3rdparty: any;
      auth_opt_fb: any;
      auth_opt_tw: any;
      conversation_id: any;
    };
  },
  res: any
) {
  let xidStuffReady = Promise.resolve();

  xidStuffReady
    .then(() => {
      let generateShortUrl = req.p.short_url;

      isUserAllowedToCreateConversations(
        req.p.uid,
        function (err: any, isAllowed: any) {
          if (err) {
            fail(
              res,
              403,
              "polis_err_add_conversation_failed_user_check",
              err
            );
            return;
          }
          if (!isAllowed) {
            fail(
              res,
              403,
              "polis_err_add_conversation_not_enabled",
              new Error("polis_err_add_conversation_not_enabled")
            );
            return;
          }
          let q = sql_conversations
            .insert({
              owner: req.p.uid, // creator
              org_id: req.p.org_id || req.p.uid, // assume the owner is the creator if there's no separate owner specified (
              topic: req.p.topic,
              description: req.p.description,
              survey_caption: req.p.survey_caption,
              postsurvey: req.p.postsurvey,
              // postsurvey_limit: req.p.postsurvey_limit,
              // postsurvey_submissions: req.p.postsurvey_submissions,
              // postsurvey_redirect: req.p.postsurvey_redirect,
              is_active: req.p.is_active,
              is_data_open: req.p.is_data_open,
              is_draft: req.p.is_draft,
              is_public: true, // req.p.short_url,
              is_anon: req.p.is_anon,
              profanity_filter: req.p.profanity_filter,
              spam_filter: req.p.spam_filter,
              strict_moderation: req.p.strict_moderation,
              context: req.p.context || null,
              owner_sees_participation_stats:
                !!req.p.owner_sees_participation_stats,
              // Set defaults for fields that aren't set at postgres level.
              auth_needed_to_vote:
                req.p.auth_needed_to_vote || DEFAULTS.auth_needed_to_vote,
              auth_needed_to_write:
                req.p.auth_needed_to_write || DEFAULTS.auth_needed_to_write,
              auth_opt_allow_3rdparty:
                req.p.auth_opt_allow_3rdparty ||
                DEFAULTS.auth_opt_allow_3rdparty,
              auth_opt_tw: req.p.auth_opt_tw || DEFAULTS.auth_opt_tw,
            })
            .returning("*")
            .toString();

          pgQuery(
            q,
            [],
            function (err: any, result: { rows: { zid: any }[] }) {
              if (err) {
                if (isDuplicateKey(err)) {
                  logger.error("polis_err_add_conversation", err);
                  failWithRetryRequest(res);
                } else {
                  fail(res, 500, "polis_err_add_conversation", err);
                }
                return;
              }

              let zid =
                result && result.rows && result.rows[0] && result.rows[0].zid;

              const zinvitePromise = req.p.conversation_id
                ? Conversation.getZidFromConversationId(
                    req.p.conversation_id
                  ).then((zid: number) => {
                    return zid === 0 ? req.p.conversation_id : null;
                  })
                : generateAndRegisterZinvite(zid, generateShortUrl);

              zinvitePromise
                .then(function (zinvite: null) {
                  if (zinvite === null) {
                    fail(
                      res,
                      400,
                      "polis_err_conversation_id_already_in_use",
                      err
                    );
                    return;
                  }
                  // NOTE: OK to return conversation_id, because this conversation was just created by this user.
                  finishOne(res, {
                    url: buildConversationUrl(req, zinvite),
                    zid: zid,
                  });
                })
                .catch(function (err: any) {
                  fail(res, 500, "polis_err_zinvite_create", err);
                });
            }
          ); // end insert
        }
      ); // end isUserAllowedToCreateConversations
    })
    .catch((err: any) => {
      fail(res, 500, "polis_err_conversation_create", err);
    }); // end xidStuffReady
} // end post conversations

function handle_POST_query_participants_by_metadata(
  req: { p: { uid?: any; zid: any; pmaids: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: never[]): void; new (): any };
    };
  }
) {
  let uid = req.p.uid;
  let zid = req.p.zid;
  let pmaids = req.p.pmaids;

  if (!pmaids.length) {
    // empty selection
    return res.status(200).json([]);
  }

  function doneChecking() {
    // find list of participants who are not eliminated by the list of excluded choices.
    pgQuery_readOnly(
      // 3. invert the selection of participants, so we get those who passed the filter.
      "select pid from participants where zid = ($1) and pid not in " +
        // 2. find the people who chose those answers
        "(select pid from participant_metadata_choices where alive = TRUE and pmaid in " +
        // 1. find the unchecked answers
        "(select pmaid from participant_metadata_answers where alive = TRUE and zid = ($2) and pmaid not in (" +
        pmaids.join(",") +
        "))" +
        ")" +
        ";",
      [zid, zid],
      function (err: any, results: { rows: any }) {
        if (err) {
          fail(res, 500, "polis_err_metadata_query", err);
          return;
        }
        // Argument of type 'any[]' is not assignable to parameter of type 'never[]'.ts(2345)
        // @ts-ignore
        res.status(200).json(_.pluck(results.rows, "pid"));
      }
    );
  }

  isOwnerOrParticipant(zid, uid, doneChecking);
}
function handle_POST_sendCreatedLinkToEmail(
  req: { p: { uid?: any; zid: string } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: {}): void; new (): any };
    };
  }
) {
  pgQuery_readOnly(
    "SELECT * FROM users WHERE uid = $1",
    [req.p.uid],
    function (err: any, results: { rows: UserType[] }) {
      if (err) {
        fail(res, 500, "polis_err_get_email_db", err);
        return;
      }
      let email = results.rows[0].email;
      let fullname = results.rows[0].hname;
      pgQuery_readOnly(
        "select * from zinvites where zid = $1",
        [req.p.zid],
        function (err: any, results: { rows: { zinvite: any }[] }) {
          let zinvite = results.rows[0].zinvite;
          let server = getServerNameWithProtocol(req);
          let createdLink = server + "/#" + req.p.zid + "/" + zinvite;
          let body =
            "" +
            "Hi " +
            fullname +
            ",\n" +
            "\n" +
            "Here's a link to the conversation you just created. Use it to invite participants to the conversation. Share it by whatever network you prefer - Gmail, Facebook, Twitter, etc., or just post it to your website or blog. Try it now! Click this link to go to your conversation: \n" +
            "\n" +
            createdLink +
            "\n" +
            "\n" +
            "With gratitude,\n" +
            "\n" +
            "The team";

          return sendTextEmail(
            polisFromAddress,
            email,
            "Link: " + createdLink,
            body
          )
            .then(function () {
              res.status(200).json({});
            })
            .catch(function (err: any) {
              fail(res, 500, "polis_err_sending_created_link_to_email", err);
            });
        }
      );
    }
  );
}

function handle_POST_notifyTeam(
  req: {
    p: {
      webserver_pass: string | undefined;
      webserver_username: string | undefined;
      subject: any;
      body: any;
    };
  },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: {}): void; new (): any };
    };
  }
) {
  if (
    req.p.webserver_pass !== Config.webserverPass ||
    req.p.webserver_username !== Config.webserverUsername
  ) {
    return fail(res, 403, "polis_err_notifyTeam_auth");
  }
  let subject = req.p.subject;
  let body = req.p.body;
  emailTeam(subject, body)
    .then(() => {
      res.status(200).json({});
    })
    .catch((err: any) => {
      return fail(res, 500, "polis_err_notifyTeam", err);
    });
}

function handle_POST_sendEmailExportReady(
  req: {
    p: {
      webserver_pass: string | undefined;
      webserver_username: string | undefined;
      email: any;
      conversation_id: string;
      filename: any;
    };
  },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: {}): void; new (): any };
    };
  }
) {
  if (
    req.p.webserver_pass !== Config.webserverPass ||
    req.p.webserver_username !== Config.webserverUsername
  ) {
    return fail(res, 403, "polis_err_sending_export_link_to_email_auth");
  }

  const serverUrl = Config.getServerUrl();
  const email = req.p.email;
  const subject =
    "Data export for conversation metropolis.vote/c/" + req.p.conversation_id;
  const fromAddress = `Polis Team <${Config.adminEmailDataExport}>`;
  const body = `Greetings

You created a data export for conversation ${serverUrl}/${req.p.conversation_id} that has just completed. You can download the results for this conversation at the following url:

${serverUrl}/api/v3/dataExport/results?filename=${req.p.filename}&conversation_id=${req.p.conversation_id}

Please let us know if you have any questions about the data.

Thanks for using Metropolis!
`;

  sendTextEmail(fromAddress, email, subject, body)
    .then(function () {
      res.status(200).json({});
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_sending_export_link_to_email", err);
    });
}

function addParticipant(zid: any, uid?: any) {
  return pgQueryP(
    "INSERT INTO participants_extended (zid, uid) VALUES ($1, $2);",
    [zid, uid]
  ).then(() => {
    return pgQueryP(
      "INSERT INTO participants (pid, zid, uid, created) VALUES (NULL, $1, $2, default) RETURNING *;",
      [zid, uid]
    );
  });
}


function getSocialParticipantsForMod_timed(
  zid?: any,
  limit?: any,
  mod?: any,
  convOwner?: any
) {
  return getSocialParticipantsForMod
    .apply(null, [zid, limit, mod, convOwner])
    .then(function (results: any) {
      return results;
    });
}

function getSocialParticipantsForMod(
  zid: any,
  limit: any,
  mod: any,
  owner: any
) {
  let modClause = "";
  let params = [zid, limit, owner];
  if (!_.isUndefined(mod)) {
    modClause = " and mod = ($4)";
    params.push(mod);
  }

  let q =
    "with " +
    "p as (select uid, pid, mod from participants where zid = ($1) " +
    modClause +
    "), " + // and vote_count >= 1
    "final_set as (select * from p limit ($2)), " +
    "xids_subset as (select * from xids where owner = ($3) and x_profile_image_url is not null), " +
    "all_rows as (select " +
    // "final_set.priority, " +
    "final_set.mod, " +
    // "all_friends.uid is not null as is_fb_friend, " +
    // "final_set.uid " +
    "xids_subset.x_profile_image_url as x_profile_image_url, " +
    "xids_subset.xid as xid, " +
    "xids_subset.x_name as x_name, " +
    // "xids_subset.x_email as x_email, " +

    "final_set.pid " +
    "from final_set " +
    "left join xids_subset on final_set.uid = xids_subset.uid " +
    ") " +
    "select * from all_rows where (xid is not null) " +
    // "select * from all_rows " +
    ";";
  return pgQueryP(q, params);
}

const getSocialInfoForUsers = User.getSocialInfoForUsers;


function handle_GET_github_init(
  req: { p: { dest: string; owner: string } },
  res: { redirect: (arg0: string) => void }
){
  let dest = req.p.dest
  const clientId = process.env.GH_BASIC_CLIENT_ID;
  const redirectUrl = `https://github.com/login/oauth/authorize?scope=user:email&client_id=${clientId}&dest=${dest}`;

  res.redirect(redirectUrl);
}

function handle_GET_github_oauth_callback(
  req: { p: { uid?: any; code: any; dest?: any } },
  res: any // { redirect: (arg0: any) => void }
) {
  handleGithubOauthCallback(req, res).catch((err) => {
    fail(res, 500, err.message);
  })
}

function updateVoteCount(zid: any, pid: any) {
  // return pgQueryP("update participants set vote_count = vote_count + 1 where zid = ($1) and pid = ($2);",[zid, pid]);
  return pgQueryP(
    "update participants set vote_count = (select count(*) from votes where zid = ($1) and pid = ($2)) where zid = ($1) and pid = ($2)",
    [zid, pid]
  );
}

function getLocationsForParticipants(zid: any) {
  return pgQueryP_readOnly(
    "select * from participant_locations where zid = ($1);",
    [zid]
  );
}

function getPidsForGid(zid: any, gid: number, math_tick: number) {
  return Promise.all([
    getPca(zid, math_tick),
    getBidIndexToPidMapping(zid, math_tick),
  ]).then(function (o: ParticipantOption[]) {
    if (!o[0] || !o[0].asPOJO) {
      return [];
    }
    o[0] = o[0].asPOJO;
    let clusters = o[0]["group-clusters"];
    let indexToBid = o[0]["base-clusters"].id; // index to bid
    let bidToIndex = [];
    for (let i = 0; i < indexToBid.length; i++) {
      bidToIndex[indexToBid[i]] = i;
    }
    let indexToPids = o[1].bidToPid; // actually index to [pid]
    let cluster = clusters[gid];
    if (!cluster) {
      return [];
    }
    let members = cluster.members; // bids
    let pids: any[] = [];
    for (var i = 0; i < members.length; i++) {
      let bid = members[i];
      let index = bidToIndex[bid];
      let morePids = indexToPids[index];
      Array.prototype.push.apply(pids, morePids);
    }
    pids = pids.map(function (x) {
      return parseInt(x);
    });
    pids.sort(function (a, b) {
      return a - b;
    });
    return pids;
  });
}

function getParticipantDemographicsForConversation(zid: any) {
  return pgQueryP(
    "select * from demographic_data left join participants on participants.uid = demographic_data.uid where zid = ($1);",
    [zid]
  );
}

function getParticipantVotesForCommentsFlaggedWith_is_meta(zid: any) {
  return pgQueryP(
    "select tid, pid, vote from votes_latest_unique where zid = ($1) and tid in (select tid from comments where zid = ($1) and is_meta = true)",
    [zid]
  );
}
function handle_GET_groupDemographics(
  req: { p: { zid: any; uid?: any; rid: any } },
  res: {
    json: (
      arg0: {
        gid: number;
        count: number;
        // fb_gender_male: 0,
        // fb_gender_female: 0,
        // fb_gender_null: 0,
        // ms_gender_estimate_fb_male: 0,
        // ms_gender_estimate_fb_female: 0,
        // ms_gender_estimate_fb_null: 0,
        // gender_guess_male: 0,
        // gender_guess_female: 0,
        // gender_guess_null: 0,
        // ms_birth_year_estimate_fb: 0,
        // ms_birth_year_count: 0,
        // birth_year_guess: 0,
        // birth_year_guess_count: 0,
        // convenient counts
        gender_male: number;
        gender_female: number;
        gender_null: number;
        birth_year: number;
        birth_year_count: number;
        meta_comment_agrees: {};
        meta_comment_disagrees: {};
        meta_comment_passes: {};
      }[]
    ) => void;
  }
) {
  let zid = req.p.zid;
  Promise.all([
    getPidsForGid(zid, 0, -1),
    getPidsForGid(zid, 1, -1),
    getPidsForGid(zid, 2, -1),
    getPidsForGid(zid, 3, -1),
    getPidsForGid(zid, 4, -1),
    getParticipantDemographicsForConversation(zid),
    getParticipantVotesForCommentsFlaggedWith_is_meta(zid),
    isModerator(req.p.zid, req.p.uid),
  ])
    .then((o: any[]) => {
      let groupPids = [];
      let groupStats = [];

      let meta = o[5];
      let metaVotes = o[6];
      let isMod = o[7];

      const isReportQuery = !_.isUndefined(req.p.rid);

      if (!isMod && !isReportQuery) {
        throw "polis_err_groupDemographics_auth";
      }

      for (let i = 0; i < 5; i++) {
        if (o[i] && o[i].length) {
          groupPids.push(o[i]);

          groupStats.push({
            gid: i,
            count: 0,
            // fb_gender_male: 0,
            // fb_gender_female: 0,
            // fb_gender_null: 0,
            // ms_gender_estimate_fb_male: 0,
            // ms_gender_estimate_fb_female: 0,
            // ms_gender_estimate_fb_null: 0,
            // gender_guess_male: 0,
            // gender_guess_female: 0,
            // gender_guess_null: 0,
            // ms_birth_year_estimate_fb: 0,
            // ms_birth_year_count: 0,
            // birth_year_guess: 0,
            // birth_year_guess_count: 0,

            // convenient counts
            gender_male: 0,
            gender_female: 0,
            gender_null: 0,
            birth_year: 0,
            birth_year_count: 0,

            meta_comment_agrees: {},
            meta_comment_disagrees: {},
            meta_comment_passes: {},
          });
        } else {
          break;
        }
      }
      meta = _.indexBy(meta, "pid");
      let pidToMetaVotes = _.groupBy(metaVotes, "pid");

      for (let i = 0; i < groupStats.length; i++) {
        // Type '{ gid: number; count: number; gender_male: number; gender_female: number;
        // gender_null: number; birth_year: number; birth_year_count: number;
        // meta_comment_agrees: { }; meta_comment_disagrees: { }; meta_comment_passes: { }; }
        // ' is missing the following properties from type 'DemographicEntry':
        // ms_birth_year_estimate_fb, ms_birth_year_count, birth_year_guess,
        // birth_year_guess_countts(2739)
        //
        // @ts-ignore
        let s: DemographicEntry = groupStats[i];
        let pids = groupPids[i];
        for (let p = 0; p < pids.length; p++) {
          let pid = pids[p];
          let ptptMeta = meta[pid];
          if (ptptMeta) {
            s.count += 1;
            // if (ptptMeta.fb_gender === 0) {
            //   s.fb_gender_male += 1;
            // } else if (ptptMeta.fb_gender === 1) {
            //   s.fb_gender_female += 1;
            // } else {
            //   s.fb_gender_null += 1;
            // }
            // if (ptptMeta.gender_guess === 0) {
            //   s.gender_guess_male += 1;
            // } else if (ptptMeta.gender_guess === 1) {
            //   s.gender_guess_female += 1;
            // } else {
            //   s.gender_guess_null += 1;
            // }
            // if (ptptMeta.ms_birth_year_estimate_fb > 1900) {
            //   s.ms_birth_year_estimate_fb += ptptMeta.ms_birth_year_estimate_fb;
            //   s.ms_birth_year_count += 1;
            // }
            // if (ptptMeta.ms_gender_estimate_fb === 0) {
            //   s.ms_gender_estimate_fb_male += 1;
            // } else if (ptptMeta.ms_gender_estimate_fb === 1) {
            //   s.ms_gender_estimate_fb_female += 1;
            // } else {
            //   s.ms_gender_estimate_fb_null += 1;
            // }

            // if (ptptMeta.birth_year_guess) {
            //   s.birth_year_guess += ptptMeta.birth_year_guess;
            //   s.birth_year_guess_count += 1;
            // }

            // compute convenient counts
            let gender = null;
            if (_.isNumber(ptptMeta.fb_gender)) {
              gender = ptptMeta.fb_gender;
            } else if (_.isNumber(ptptMeta.gender_guess)) {
              gender = ptptMeta.gender_guess;
            } else if (_.isNumber(ptptMeta.ms_gender_estimate_fb)) {
              gender = ptptMeta.ms_gender_estimate_fb;
            }
            if (gender === 0) {
              s.gender_male += 1;
            } else if (gender === 1) {
              s.gender_female += 1;
            } else {
              s.gender_null += 1;
            }
            let birthYear = null;
            if (ptptMeta.ms_birth_year_estimate_fb > 1900) {
              birthYear = ptptMeta.ms_birth_year_estimate_fb;
            } else if (ptptMeta.birth_year_guess > 1900) {
              birthYear = ptptMeta.birth_year_guess;
            }
            if (birthYear > 1900) {
              s.birth_year += birthYear;
              s.birth_year_count += 1;
            }
          }
          let ptptMetaVotes = pidToMetaVotes[pid];
          if (ptptMetaVotes) {
            for (let v = 0; v < ptptMetaVotes.length; v++) {
              let vote = ptptMetaVotes[v];
              if (vote.vote === polisTypes.reactions.pass) {
                // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
                // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
                // @ts-ignore
                s.meta_comment_passes[vote.tid] =
                  // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
                  // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
                  // @ts-ignore
                  1 + (s.meta_comment_passes[vote.tid] || 0);
              } else if (vote.vote === polisTypes.reactions.pull) {
                // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
                // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
                // @ts-ignore
                s.meta_comment_agrees[vote.tid] =
                  // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
                  // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
                  // @ts-ignore
                  1 + (s.meta_comment_agrees[vote.tid] || 0);
              } else if (vote.vote === polisTypes.reactions.push) {
                // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
                // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
                // @ts-ignore
                s.meta_comment_disagrees[vote.tid] =
                  // Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type '{}'.
                  // No index signature with a parameter of type 'string' was found on type '{}'.ts(7053)
                  // @ts-ignore
                  1 + (s.meta_comment_disagrees[vote.tid] || 0);
              }
            }
          }
        }
        s.ms_birth_year_estimate_fb =
          s.ms_birth_year_estimate_fb / s.ms_birth_year_count;
        s.birth_year_guess = s.birth_year_guess / s.birth_year_guess_count;
        s.birth_year = s.birth_year / s.birth_year_count;
      }

      res.json(groupStats);
    })
    .catch((err: any) => {
      fail(res, 500, "polis_err_groupDemographics", err);
    });
}

// this is for testing the encryption
function handle_GET_logMaxmindResponse(
  req: { p: { uid?: any; zid: any; user_uid?: any } },
  res: { json: (arg0: {}) => void }
) {
  if (!isPolisDev(req.p.uid) || !devMode) {
    // TODO fix this by piping the error from the usage of this in ./app
    // Cannot find name 'err'.ts(2304)
    // @ts-ignore
    return fail(res, 403, "polis_err_permissions", err);
  }
  pgQueryP(
    "select * from participants_extended where zid = ($1) and uid = ($2);",
    [req.p.zid, req.p.user_uid]
  )
    //     Argument of type '(results: string | any[]) => void' is not assignable to parameter of type '(value: unknown) => void | PromiseLike<void>'.
    // Types of parameters 'results' and 'value' are incompatible.
    //   Type 'unknown' is not assignable to type 'string | any[]'.
    //     Type 'unknown' is not assignable to type 'any[]'.ts(2345)
    // @ts-ignore
    .then((results: string | any[]) => {
      if (!results || !results.length) {
        res.json({});
        return;
      }
      var o = results[0];
      _.each(o, (val: any, key: string) => {
        if (key.startsWith("encrypted_")) {
          o[key] = decrypt(val);
        }
      });
      res.json({});
    })
    .catch((err: any) => {
      fail(res, 500, "polis_err_get_participantsExtended", err);
    });
}

function handle_GET_locations(
  req: { p: { zid: any; gid: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: any): void; new (): any };
    };
  }
) {
  let zid = req.p.zid;
  let gid = req.p.gid;

  Promise.all([getPidsForGid(zid, gid, -1), getLocationsForParticipants(zid)])
    .then(function (o: any[]) {
      let pids = o[0];
      let locations = o[1];
      locations = locations.filter(function (locData: { pid: any }) {
        let pidIsInGroup = _.indexOf(pids, locData.pid, true) >= 0; // uses binary search
        return pidIsInGroup;
      });
      locations = locations.map(function (locData: { lat: any; lng: any }) {
        return {
          lat: locData.lat,
          lng: locData.lng,
          n: 1,
        };
      });
      res.status(200).json(locations);
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_locations_01", err);
    });
}
function removeNullOrUndefinedProperties(o: { [x: string]: any }) {
  for (var k in o) {
    let v = o[k];
    if (v === null || v === undefined) {
      delete o[k];
    }
  }
  return o;
}

function pullXInfoIntoSubObjects(ptptoiRecord: any) {
  let p = ptptoiRecord;
  if (p.x_profile_image_url || p.xid || p.x_email) {
    p.xInfo = {};
    p.xInfo.x_profile_image_url = p.x_profile_image_url;
    p.xInfo.xid = p.xid;
    p.xInfo.x_name = p.x_name;
    // p.xInfo.x_email = p.x_email;
    delete p.x_profile_image_url;
    delete p.xid;
    delete p.x_name;
    delete p.x_email;
  }
  return p;
}

function handle_PUT_ptptois(
  req: { p: { zid: any; uid?: any; pid: any; mod: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: {}): void; new (): any };
    };
  }
) {
  let zid = req.p.zid;
  let uid = req.p.uid;
  let pid = req.p.pid;
  let mod = req.p.mod;
  isModerator(zid, uid)
    .then(function (isMod: any) {
      if (!isMod) {
        fail(res, 403, "polis_err_ptptoi_permissions_123");
        return;
      }
      return pgQueryP(
        "update participants set mod = ($3) where zid = ($1) and pid = ($2);",
        [zid, pid, mod]
      ).then(function () {
        res.status(200).json({});
      });
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_ptptoi_misc_234", err);
    });
}
function handle_GET_ptptois(
  req: { p: { zid: any; mod: any; uid?: any; conversation_id: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: any): void; new (): any };
    };
  }
) {
  let zid = req.p.zid;
  let mod = req.p.mod;
  let uid = req.p.uid;
  let limit = 99999;

  let convPromise = getConversationInfo(req.p.zid);
  let socialPtptsPromise = convPromise.then((conv: { owner: any }) => {
    return getSocialParticipantsForMod_timed(zid, limit, mod, conv.owner);
  });

  Promise.all([socialPtptsPromise, getConversationInfo(zid)])
    .then(function (a: any[]) {
      let ptptois = a[0];
      let conv = a[1];
      let isOwner = uid === conv.owner;
      let isAllowed = isOwner || isPolisDev(req.p.uid) || conv.is_data_open;
      if (isAllowed) {
        ptptois = ptptois.map(pullXInfoIntoSubObjects);
        ptptois = ptptois.map(removeNullOrUndefinedProperties);
        ptptois = ptptois.map(function (p: { conversation_id: any }) {
          p.conversation_id = req.p.conversation_id;
          return p;
        });
      } else {
        ptptois = [];
      }
      res.status(200).json(ptptois);
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_ptptoi_misc", err);
    });
}


async function doSendEinvite(req: any, email: any) {
  const einvite = await generateTokenP(30, false);
  await pgQueryP(
    "insert into einvites (email, einvite) values ($1, $2);",
    [email, einvite]
  );
  await sendEinviteEmail(req, email, einvite);
}

function handle_POST_einvites(
  req: { p: { email: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: {}): void; new (): any };
    };
  }
) {
  let email = req.p.email;
  doSendEinvite(req, email)
    .then(function () {
      res.status(200).json({});
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_sending_einvite", err);
    });
}

// function handle_GET_cache_purge(req, res) {

//   let hostname = "metropolis.vote";
//   // NOTE: can't purge preprod independently unless we set up a separate domain on cloudflare, AFAIK

//   request.post("https://www.cloudflare.com/api_json.html").form({
//     a: 'fpurge_ts',
//     tkn: process.env.CLOUDFLARE_API_KEY,
//     email: process.env.CLOUDFLARE_API_EMAIL,
//     z: hostname,
//     v: 1,
//   })
//   .pipe(res);

// }
function handle_GET_einvites(
  req: { p: { einvite: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: any): void; new (): any };
    };
  }
) {
  let einvite = req.p.einvite;

  pgQueryP("select * from einvites where einvite = ($1);", [einvite])
    .then(function (rows: string | any[]) {
      if (!rows.length) {
        throw new Error("polis_err_missing_einvite");
      }
      res.status(200).json(rows[0]);
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_fetching_einvite", err);
    });
}

function generateSingleUseUrl(
  req: any,
  conversation_id: string,
  suzinvite: string
) {
  return (
    getServerNameWithProtocol(req) +
    "/ot/" +
    conversation_id +
    "/" +
    suzinvite
  );
}
function buildConversationUrl(req: any, zinvite: string | null) {
  return getServerNameWithProtocol(req) + "/" + zinvite;
}

function getConversationUrl(req: any, zid: any, dontUseCache: boolean) {
  return getZinvite(zid, dontUseCache).then(function (zinvite: any) {
    return buildConversationUrl(req, zinvite);
  });
}
function createOneSuzinvite(
  xid: any,
  zid: any,
  owner: any,
  generateSingleUseUrl: (arg0: any, arg1: any) => any
) {
  return generateSUZinvites(1).then(function (suzinviteArray: any[]) {
    let suzinvite = suzinviteArray[0];
    return pgQueryP(
      "INSERT INTO suzinvites (suzinvite, xid, zid, owner) VALUES ($1, $2, $3, $4);",
      [suzinvite, xid, zid, owner]
    )
      .then(function () {
        return getZinvite(zid);
      })
      .then(function (conversation_id: any) {
        return {
          zid: zid,
          conversation_id: conversation_id,
        };
      })
      .then(function (o: { zid: any; conversation_id: any }) {
        return {
          zid: o.zid,
          conversation_id: o.conversation_id,
          suurl: generateSingleUseUrl(o.conversation_id, suzinvite),
        };
      });
  });
}

// function handle_POST_users_invite(req, res) {
//     let owner = req.p.uid;
//     let xids = req.p.xids;
//     let zid = req.p.zid;
//     // generate some tokens
//     // add them to a table paired with user_ids
//     // return URLs with those.
//     generateSUZinvites(xids.length).then(function(suzinviteArray) {
//         let pairs = _.zip(xids, suzinviteArray);

//         let valuesStatements = pairs.map(function(pair) {
//             let xid = escapeLiteral(pair[0]);
//             let suzinvite = escapeLiteral(pair[1]);
//             let statement = "("+ suzinvite + ", " + xid + "," + zid+","+owner+")";
//             return statement;
//         });
//         let query = "INSERT INTO suzinvites (suzinvite, xid, zid, owner) VALUES " + valuesStatements.join(",") + ";";
//         pgQuery(query, [], function(err, results) {
//             if (err) { fail(res, 500, "polis_err_saving_invites", err); return; }
//             getZinvite(zid).then(function(conversation_id) {
//                 res.json({
//                     urls: suzinviteArray.map(function(suzinvite) {
//                         return generateSingleUseUrl(req, conversation_id, suzinvite);
//                     }),
//                     xids: xids,
//                 });
//             }, function(err) {
//                 fail(res, 500, "polis_err_generating_single_use_invites_missing_conversation_id", err);
//             }).catch(function(err) {
//                 fail(res, 500, "polis_err_generating_single_use_invites", err);
//             });
//         });
//     }).catch(function(err) {
//         fail(res, 500, "polis_err_generating_single_use_invites", err);
//     });
// }

function handle_GET_testConnection(
  req: any,
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: { status: string }): void; new (): any };
    };
  }
) {
  res.status(200).json({
    status: "ok",
  });
}

function handle_GET_testDatabase(
  req: any,
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: { status: string }): void; new (): any };
    };
  }
) {
  pgQueryP("select uid from users limit 1", []).then(
    () => {
      res.status(200).json({
        status: "ok",
      });
    },
    (err: any) => {
      fail(res, 500, "polis_err_testDatabase", err);
    }
  );
}

function sendSuzinviteEmail(
  req: any,
  email: any,
  conversation_id: string,
  suzinvite: string
) {
  let serverName = getServerNameWithProtocol(req);
  let body =
    "" +
    "Welcome to Metropolis!\n" +
    "\n" +
    "Click this link to open your account:\n" +
    "\n" +
    serverName +
    "/ot/" +
    conversation_id +
    "/" +
    suzinvite +
    "\n";

  return sendTextEmail(
    polisFromAddress,
    email,
    "Metropolis: Join the conversation!",
    body
  );
}

function addInviter(inviter_uid?: any, invited_email?: any) {
  return pgQueryP(
    "insert into inviters (inviter_uid, invited_email) VALUES ($1, $2);",
    [inviter_uid, invited_email]
  );
}

function handle_POST_users_invite(
  req: { p: { uid?: any; emails: any; zid: any; conversation_id: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: { status: string }): void; new (): any };
    };
  }
) {
  let uid = req.p.uid;
  let emails = req.p.emails;
  let zid = req.p.zid;
  let conversation_id = req.p.conversation_id;

  getConversationInfo(zid)
    .then(function (conv: { owner: any }) {
      let owner = conv.owner;

      // generate some tokens
      // add them to a table paired with user_ids
      // return URLs with those.
      generateSUZinvites(emails.length)
        .then(function (suzinviteArray: any) {
          let pairs = _.zip(emails, suzinviteArray);

          let valuesStatements = pairs.map(function (pair: any[]) {
            let xid = escapeLiteral(pair[0]);
            let suzinvite = escapeLiteral(pair[1]);
            let statement =
              "(" + suzinvite + ", " + xid + "," + zid + "," + owner + ")";
            return statement;
          });
          let query =
            "INSERT INTO suzinvites (suzinvite, xid, zid, owner) VALUES " +
            valuesStatements.join(",") +
            ";";
          pgQuery(query, [], function (err: any) {
            if (err) {
              fail(res, 500, "polis_err_saving_invites", err);
              return;
            }

            Promise.all(
              pairs.map(function (pair: any[]) {
                let email = pair[0];
                let suzinvite = pair[1];
                return sendSuzinviteEmail(
                  req,
                  email,
                  conversation_id,
                  suzinvite
                ).then(
                  function () {
                    return addInviter(uid, email);
                  },
                  function (err: any) {
                    fail(res, 500, "polis_err_sending_invite", err);
                  }
                );
              })
            )
              .then(function () {
                res.status(200).json({
                  status: ":-)",
                });
              })
              .catch(function (err: any) {
                fail(res, 500, "polis_err_sending_invite", err);
              });
          });
        })
        .catch(function (err: any) {
          fail(res, 500, "polis_err_generating_invites", err);
        });
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_getting_conversation_info", err);
    });
}

function doGetConversationPreloadInfo(conversation_id: any) {
  // return Promise.resolve({});
  return Conversation.getZidFromConversationId(conversation_id)
    .then(function (zid: any) {
      return Promise.all([getConversationInfo(zid)]);
    })
    .then(function (a: any[]) {
      let conv = a[0];

      let auth_opt_allow_3rdparty = ifDefinedFirstElseSecond(
        conv.auth_opt_allow_3rdparty,
        DEFAULTS.auth_opt_allow_3rdparty
      );
      let auth_opt_tw_computed =
        auth_opt_allow_3rdparty &&
        ifDefinedFirstElseSecond(conv.auth_opt_tw, DEFAULTS.auth_opt_tw);

      conv = {
        topic: conv.topic,
        description: conv.description,
        survey_caption: conv.survey_caption,
        postsurvey: conv.postsurvey,
        postsurvey_limit: conv.postsurvey_limit,
        postsurvey_submissions: conv.postsurvey_submissions,
        postsurvey_redirect: conv.postsurvey_redirect,
        created: conv.created,
        link_url: conv.link_url,
        parent_url: conv.parent_url,
        vis_type: conv.vis_type,
        write_type: conv.write_type,
        help_type: conv.help_type,
        socialbtn_type: conv.socialbtn_type,
        bgcolor: conv.bgcolor,
        help_color: conv.help_color,
        help_bgcolor: conv.help_bgcolor,
        style_btn: conv.style_btn,
        auth_needed_to_vote: ifDefinedFirstElseSecond(
          conv.auth_needed_to_vote,
          DEFAULTS.auth_needed_to_vote
        ),
        auth_needed_to_write: ifDefinedFirstElseSecond(
          conv.auth_needed_to_write,
          DEFAULTS.auth_needed_to_write
        ),
        auth_opt_allow_3rdparty: auth_opt_allow_3rdparty,
        auth_opt_tw_computed: auth_opt_tw_computed,
      };
      conv.conversation_id = conversation_id;
      // conv = Object.assign({}, optionalResults, conv);
      return conv;
    });
}

function handle_GET_conversationPreloadInfo(
  req: { p: { conversation_id: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: any): void; new (): any };
    };
  }
) {
  return doGetConversationPreloadInfo(req.p.conversation_id).then(
    (conv: any) => {
      res.status(200).json(conv);
    },
    (err: any) => {
      fail(res, 500, "polis_err_get_conversation_preload_info", err);
    }
  );
}

function makeRedirectorTo(path: string) {
  return function (
    req: { headers?: { host: string } },
    res: {
      writeHead: (arg0: number, arg1: { Location: string }) => void;
      end: () => void;
    }
  ) {
    let protocol = devMode ? "http://" : "https://";
    let url = protocol + req?.headers?.host + path;
    res.writeHead(302, {
      Location: url,
    });
    res.end();
  };
}

// https://github.com/mindmup/3rdpartycookiecheck/
// https://stackoverflow.com/questions/32601424/render-raw-html-in-response-with-express
function fetchThirdPartyCookieTestPt1(
  req: any,
  res: {
    set: (arg0: { "Content-Type": string }) => void;
    send: (arg0: Buffer) => void;
  }
) {
  res.set({ "Content-Type": "text/html" });
  res.send(
    Buffer.from(
      "<body>\n" +
        "<script>\n" +
        '  document.cookie="thirdparty=yes; Max-Age=3600; SameSite=None; Secure";\n' +
        '  document.location="thirdPartyCookieTestPt2.html";\n' +
        "</script>\n" +
        "</body>"
    )
  );
}
function fetchThirdPartyCookieTestPt2(
  req: any,
  res: {
    set: (arg0: { "Content-Type": string }) => void;
    send: (arg0: Buffer) => void;
  }
) {
  res.set({ "Content-Type": "text/html" });
  res.send(
    Buffer.from(
      "<body>\n" +
        "<script>\n" +
        "  if (window.parent) {\n" +
        "   if (/thirdparty=yes/.test(document.cookie)) {\n" +
        "     window.parent.postMessage('MM:3PCsupported', '*');\n" +
        "   } else {\n" +
        "     window.parent.postMessage('MM:3PCunsupported', '*');\n" +
        "   }\n" +
        "   document.cookie = 'thirdparty=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';\n" +
        "  }\n" +
        "</script>\n" +
        "</body>"
    )
  );
}

function ifDefinedFirstElseSecond(first: any, second: boolean) {
  return _.isUndefined(first) ? second : first;
}

function handle_GET_iip_conversation(
  req: { params: { conversation_id: any } },
  res: {
    set: (arg0: { "Content-Type": string }) => void;
    send: (arg0: string) => void;
  }
) {
  let conversation_id = req.params.conversation_id;
  res.set({
    "Content-Type": "text/html",
  });
  res.send(
    "<a href='https://metropolis.vote/" +
      conversation_id +
      "' target='_blank'>" +
      conversation_id +
      "</a>"
  );
}
function handle_GET_iim_conversation(
  req: { p: { zid: any }; params: { conversation_id: any } },
  res: {
    set: (arg0: { "Content-Type": string }) => void;
    send: (arg0: string) => void;
  }
) {
  let zid = req.p.zid;
  let conversation_id = req.params.conversation_id;
  getConversationInfo(zid)
    .then(function (info: { topic: any; created: any; description: string }) {
      res.set({
        "Content-Type": "text/html",
      });
      let title = info.topic || info.created;
      res.send(
        "<a href='https://metropolis.vote/" +
          conversation_id +
          "' target='_blank'>" +
          title +
          "</a>" +
          "<p><a href='https://metropolis.vote/m" +
          conversation_id +
          "' target='_blank'>moderate</a></p>" +
          (info.description ? "<p>" + info.description + "</p>" : "")
      );
    })
    .catch(function (err: any) {
      fail(res, 500, "polis_err_fetching_conversation_info", err);
    });
}

function middleware_log_request_body(
  req: { body: any; path: string },
  res: any,
  next: () => void
) {
  if (devMode) {
    let b = "";
    if (req.body) {
      let temp = _.clone(req.body);
      // if (temp.email) {
      //     temp.email = "foo@foo.com";
      // }
      if (temp.password) {
        temp.password = "some_password";
      }
      if (temp.newPassword) {
        temp.newPassword = "some_password";
      }
      if (temp.password2) {
        temp.password2 = "some_password";
      }
      if (temp.hname) {
        temp.hname = "somebody";
      }
      if (temp.polisApiKey) {
        temp.polisApiKey = "pkey_somePolisApiKey";
      }
      b = JSON.stringify(temp);
    }
    logger.debug("middleware_log_request_body", { path: req.path, body: b });
  } else {
    // don't log the route or params, since Heroku does that for us.
  }
  next();
}

function middleware_log_middleware_errors(
  err: any,
  req: any,
  res: any,
  next: (arg0?: any) => void
) {
  if (!err) {
    return next();
  }
  logger.error("middleware_log_middleware_errors", err);
  next(err);
}

function middleware_check_if_options(
  req: { method: string },
  res: { send: (arg0: number) => any },
  next: () => any
) {
  if (req.method.toLowerCase() !== "options") {
    return next();
  }
  return res.send(204);
}

let middleware_responseTime_start = responseTime(function (
  req: { route: { path: any } },
  res: any,
  time: number
) {
  if (req && req.route && req.route.path) {
    let path = req.route.path;
    time = Math.trunc(time);
    addInRamMetric(path, time);
  }
});


export {
  addCorsHeader,
  auth,
  authOptional,
  COOKIES,
  denyIfNotFromWhitelistedDomain,
  devMode,
  emailTeam,
  enableAgid,
  fail,
  fetchThirdPartyCookieTestPt1,
  fetchThirdPartyCookieTestPt2,
  getPidForParticipant,
  haltOnTimeout,
  HMAC_SIGNATURE_PARAM_NAME,
  makeRedirectorTo,
  pidCache,
  redirectIfHasZidButNoConversationId,
  redirectIfNotHttps,
  sendTextEmail,
  timeout,
  writeDefaultHead,
  middleware_check_if_options,
  middleware_log_middleware_errors,
  middleware_log_request_body,
  middleware_responseTime_start,
  doGetConversationPreloadInfo,
  // handlers
  handle_DELETE_metadata_answers,
  handle_DELETE_metadata_questions,
  handle_GET_bid,
  handle_GET_bidToPid,
  handle_GET_comments,
  handle_GET_comments_translations,
  handle_GET_contexts,
  handle_GET_conversationPreloadInfo,
  handle_GET_conversations,
  handle_GET_conversationsRecentActivity,
  handle_GET_conversationsRecentlyStarted,
  handle_GET_conversationStats,
  handle_GET_math_correlationMatrix,
  handle_GET_dataExport,
  handle_GET_domainWhitelist,
  handle_GET_einvites,
  handle_GET_groupDemographics,
  handle_GET_iim_conversation,
  handle_GET_iip_conversation,
  handle_GET_launchPrep,
  handle_GET_locations,
  handle_GET_logMaxmindResponse,
  handle_GET_math_pca,
  handle_GET_math_pca2,
  handle_GET_metadata,
  handle_GET_metadata_answers,
  handle_GET_metadata_choices,
  handle_GET_metadata_questions,
  handle_GET_nextComment,
  handle_GET_notifications_subscribe,
  handle_GET_notifications_unsubscribe,
  handle_GET_participants,
  handle_GET_participation,
  handle_GET_participationInit,
  handle_GET_ptptois,
  handle_GET_reports,
  handle_GET_snapshot,
  handle_GET_testConnection,
  handle_GET_testDatabase,
  handle_GET_tryCookie,
  handle_GET_github_init,
  handle_GET_github_oauth_callback,
  handle_GET_users,
  handle_GET_verification,
  handle_GET_votes,
  handle_GET_votes_me,
  handle_GET_xids,
  handle_GET_zinvites,
  handle_POST_auth_deregister,
  handle_POST_auth_login,
  handle_POST_auth_new,
  handle_POST_auth_password,
  handle_POST_auth_pwresettoken,
  handle_POST_comments,
  handle_POST_contexts,
  handle_POST_conversation_close,
  handle_POST_conversation_reopen,
  handle_POST_conversations,
  handle_POST_convSubscriptions,
  handle_POST_domainWhitelist,
  handle_POST_einvites,
  handle_POST_joinWithInvite,
  handle_POST_metadata_answers,
  handle_POST_metadata_questions,
  handle_POST_metrics,
  handle_POST_notifyTeam,
  handle_POST_participants,
  handle_POST_ptptCommentMod,
  handle_POST_query_participants_by_metadata,
  handle_POST_reportCommentSelections,
  handle_POST_reports,
  handle_POST_reserve_conversation_id,
  handle_POST_sendCreatedLinkToEmail,
  handle_POST_sendEmailExportReady,
  handle_POST_stars,
  handle_POST_trashes,
  handle_POST_tutorial,
  handle_POST_upvotes,
  handle_POST_users_invite,
  handle_POST_votes,
  handle_POST_xidWhitelist,
  handle_POST_zinvites,
  handle_PUT_comments,
  handle_PUT_conversations,
  handle_PUT_participants_extended,
  handle_PUT_ptptois,
  handle_PUT_reports,
  handle_PUT_users
};
