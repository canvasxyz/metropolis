"use strict";

import fs from "fs";
import * as dotenv from "dotenv";
import path from "path";
dotenv.config();

import Promise from "bluebird";
import express from "express";
import morgan from "morgan";

import Config from "./src/config";
import server from "./src/server";
import logger from "./src/utils/logger";

import {
  assignToP,
  assignToPCustom,
  getArrayOfInt,
  getArrayOfStringNonEmpty,
  getArrayOfStringNonEmptyLimitLength,
  getBool,
  getConversationIdFetchZid,
  getEmail,
  getInt,
  getIntInRange,
  getNumberInRange,
  getOptionalStringLimitLength,
  getPassword,
  getPasswordWithCreatePasswordRules,
  getReportIdFetchRid,
  getStringLimitLength,
  getUrlLimitLength,
  moveToBody,
  need,
  needCookie,
  needHeader,
  resolve_pidThing,
  want,
  wantCookie,
  wantHeader,
} from "./src/utils/parameter";

// no typedefs for express 3
const app = express();

// 'dev' format is
// :method :url :status :response-time ms - :res[content-length]
app.use(morgan("dev"));

// Trust the X-Forwarded-Proto and X-Forwarded-Host, but only on private subnets.
// See: https://github.com/pol-is/polis/issues/546
// See: https://expressjs.com/en/guide/behind-proxies.html
app.set("trust proxy", "uniquelocal");

var helpersInitialized = new Promise(function (resolve, reject) {
  resolve(server.initializePolisHelpers());
});
/* @ts-ignore */
helpersInitialized.then(
  function (o) {
    const {
      addCorsHeader,
      auth,
      authOptional,
      COOKIES,
      denyIfNotFromWhitelistedDomain,
      devMode,
      enableAgid,
      fetchThirdPartyCookieTestPt1,
      fetchThirdPartyCookieTestPt2,
      getPidForParticipant,
      haltOnTimeout,
      HMAC_SIGNATURE_PARAM_NAME,
      makeRedirectorTo,
      pidCache,
      redirectIfHasZidButNoConversationId,
      redirectIfNotHttps,
      timeout,
      writeDefaultHead,
      doGetConversationPreloadInfo,

      middleware_log_request_body,
      middleware_log_middleware_errors,
      middleware_check_if_options,
      middleware_responseTime_start,

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
      handle_GET_dataExport_results,
      handle_GET_domainWhitelist,
      handle_GET_dummyButton,
      handle_GET_einvites,
      handle_GET_facebook_delete,
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
      handle_GET_perfStats,
      handle_GET_ptptois,
      handle_GET_reports,
      handle_GET_snapshot,

      handle_GET_testConnection,
      handle_GET_testDatabase,
      handle_GET_tryCookie,
      handle_GET_twitter_oauth_callback,
      handle_GET_twitter_users,
      handle_GET_twitterBtn,
      handle_GET_users,
      handle_GET_verification,
      handle_GET_votes,
      handle_GET_votes_me,
      handle_GET_xids,
      handle_GET_zinvites,

      handle_POST_auth_deregister,
      handle_POST_auth_facebook,
      handle_POST_auth_login,
      handle_POST_auth_new,
      handle_POST_auth_password,
      handle_POST_auth_pwresettoken,
      handle_POST_comments,
      handle_POST_contexts,
      handle_POST_contributors,
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
      handle_PUT_users,
    } = o as any;

    app.disable("x-powered-by");
    // app.disable('etag'); // seems to be eating CPU, and we're not using etags yet. https://www.dropbox.com/s/hgfd5dm0e29728w/Screenshot%202015-06-01%2023.42.47.png?dl=0

    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    //
    //             BEGIN MIDDLEWARE
    //
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////

    const expressUntyped = express as any;

    app.use(middleware_responseTime_start);

    app.use(redirectIfNotHttps);
    app.use(expressUntyped.cookieParser());
    app.use(expressUntyped.bodyParser());
    app.use(writeDefaultHead);

    if (devMode) {
      app.use(expressUntyped.compress());
    } else {
      // Cloudflare would apply gzip if we didn't
      // but it's about 2x faster if we do the gzip (for the inbox query on mike's account)
      app.use(expressUntyped.compress());
    }
    app.use(middleware_log_request_body);
    app.use(middleware_log_middleware_errors);

    app.all("/api/v3/*", addCorsHeader);
    app.all("/font/*", addCorsHeader);
    app.all("/api/v3/*", middleware_check_if_options);

    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    //
    //             END MIDDLEWARE
    //
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////

    app.get("/api/v3/math/pca", handle_GET_math_pca);

    app.get(
      "/api/v3/math/pca2",
      moveToBody,
      redirectIfHasZidButNoConversationId, // TODO remove once
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      want("math_tick", getInt, assignToP),
      wantHeader(
        "If-None-Match",
        getStringLimitLength(1000),
        assignToPCustom("ifNoneMatch")
      ),
      handle_GET_math_pca2
    );

    app.get(
      "/api/v3/math/correlationMatrix",
      moveToBody,
      // need('conversation_id', getConversationIdFetchZid, assignToPCustom('zid')),
      need("report_id", getReportIdFetchRid, assignToPCustom("rid")),
      want("math_tick", getInt, assignToP, -1),
      handle_GET_math_correlationMatrix
    );

    app.get(
      "/api/v3/dataExport",
      moveToBody,
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      need("conversation_id", getStringLimitLength(1, 1000), assignToP),
      want("format", getStringLimitLength(1, 100), assignToP),
      want("unixTimestamp", getStringLimitLength(99), assignToP),
      handle_GET_dataExport
    );

    app.get(
      "/api/v3/dataExport/results",
      moveToBody,
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      need("conversation_id", getStringLimitLength(1, 1000), assignToP),
      want("filename", getStringLimitLength(1, 1000), assignToP),
      handle_GET_dataExport_results
    );

    // TODO doesn't scale, stop sending entire mapping.
    app.get(
      "/api/v3/bidToPid",
      authOptional(assignToP),
      moveToBody,
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      want("math_tick", getInt, assignToP, 0),
      handle_GET_bidToPid
    );

    app.get(
      "/api/v3/xids",
      moveToBody,
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      handle_GET_xids
    );

    // TODO cache
    app.get(
      "/api/v3/bid",
      moveToBody,
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      want("math_tick", getInt, assignToP, 0),
      handle_GET_bid
    );

    app.post(
      "/api/v3/auth/password",
      need("pwresettoken", getOptionalStringLimitLength(1000), assignToP),
      need("newPassword", getPasswordWithCreatePasswordRules, assignToP),
      handle_POST_auth_password
    );

    app.post(
      "/api/v3/auth/pwresettoken",
      need("email", getEmail, assignToP),
      handle_POST_auth_pwresettoken
    );

    app.post(
      "/api/v3/auth/deregister",
      want("showPage", getStringLimitLength(1, 99), assignToP),
      handle_POST_auth_deregister
    );

    app.get(
      "/api/v3/zinvites/:zid",
      moveToBody,
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      handle_GET_zinvites
    );

    app.post(
      "/api/v3/zinvites/:zid",
      moveToBody,
      auth(assignToP),
      want("short_url", getBool, assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      handle_POST_zinvites
    );

    // // tags: ANON_RELATED
    app.get(
      "/api/v3/participants",
      moveToBody,
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      handle_GET_participants
    );

    app.get(
      "/api/v3/dummyButton",
      moveToBody,
      need("button", getStringLimitLength(1, 999), assignToP),
      authOptional(assignToP),
      handle_GET_dummyButton
    );

    app.get(
      "/api/v3/conversations/preload",
      moveToBody,
      need("conversation_id", getStringLimitLength(1, 1000), assignToP), // we actually need conversation_id to build a url
      handle_GET_conversationPreloadInfo
    );

    app.get(
      "/api/v3/conversations/recently_started",
      auth(assignToP),
      moveToBody,
      want("sinceUnixTimestamp", getStringLimitLength(99), assignToP),
      handle_GET_conversationsRecentlyStarted
    );

    app.get(
      "/api/v3/conversations/recent_activity",
      auth(assignToP),
      moveToBody,
      want("sinceUnixTimestamp", getStringLimitLength(99), assignToP),
      handle_GET_conversationsRecentActivity
    );

    app.post(
      "/api/v3/participants",
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      want("answers", getArrayOfInt, assignToP, []), // {pmqid: [pmaid, pmaid], ...} where the pmaids are checked choices
      want("parent_url", getStringLimitLength(9999), assignToP),
      want("referrer", getStringLimitLength(9999), assignToP),
      handle_POST_participants
    );

    app.get(
      "/api/v3/notifications/subscribe",
      moveToBody,
      need(HMAC_SIGNATURE_PARAM_NAME, getStringLimitLength(10, 999), assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      need("conversation_id", getStringLimitLength(1, 1000), assignToP), // we actually need conversation_id to build a url
      need("email", getEmail, assignToP),
      handle_GET_notifications_subscribe
    );

    app.get(
      "/api/v3/notifications/unsubscribe",
      moveToBody,
      need(HMAC_SIGNATURE_PARAM_NAME, getStringLimitLength(10, 999), assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      need("conversation_id", getStringLimitLength(1, 1000), assignToP), // we actually need conversation_id to build a url
      need("email", getEmail, assignToP),
      handle_GET_notifications_unsubscribe
    );

    app.post(
      "/api/v3/convSubscriptions",
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      need("type", getInt, assignToP),
      need("email", getEmail, assignToP),
      handle_POST_convSubscriptions
    );

    app.post(
      "/api/v3/auth/login",
      need("password", getPassword, assignToP),
      want("email", getEmail, assignToP),
      handle_POST_auth_login
    );

    app.post(
      "/api/v3/joinWithInvite",
      authOptional(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      wantCookie(
        COOKIES.PERMANENT_COOKIE,
        getOptionalStringLimitLength(32),
        assignToPCustom("permanentCookieToken")
      ),
      want("suzinvite", getOptionalStringLimitLength(32), assignToP),
      want("answers", getArrayOfInt, assignToP, []), // {pmqid: [pmaid, pmaid], ...} where the pmaids are checked choices
      want("referrer", getStringLimitLength(9999), assignToP),
      want("parent_url", getStringLimitLength(9999), assignToP),
      handle_POST_joinWithInvite
    );

    app.post(
      "/api/v3/sendEmailExportReady",
      need("webserver_username", getStringLimitLength(1, 999), assignToP),
      need("webserver_pass", getStringLimitLength(1, 999), assignToP),
      need("email", getEmail, assignToP),
      need("conversation_id", getStringLimitLength(1, 1000), assignToP), // we actually need conversation_id to build a url
      need("filename", getStringLimitLength(9999), assignToP),
      handle_POST_sendEmailExportReady
    );

    app.post(
      "/api/v3/notifyTeam",
      need("webserver_username", getStringLimitLength(1, 999), assignToP),
      need("webserver_pass", getStringLimitLength(1, 999), assignToP),
      need("subject", getStringLimitLength(9999), assignToP),
      need("body", getStringLimitLength(99999), assignToP),
      handle_POST_notifyTeam
    );

    app.get(
      "/api/v3/domainWhitelist",
      moveToBody,
      auth(assignToP),
      handle_GET_domainWhitelist
    );

    app.post(
      "/api/v3/domainWhitelist",
      auth(assignToP),
      need("domain_whitelist", getOptionalStringLimitLength(999), assignToP),
      handle_POST_domainWhitelist
    );

    app.post(
      "/api/v3/xidWhitelist",
      auth(assignToP),
      need(
        "xid_whitelist",
        getArrayOfStringNonEmptyLimitLength(9999, 999),
        assignToP
      ),
      handle_POST_xidWhitelist
    );

    app.get(
      "/api/v3/conversationStats",
      moveToBody,
      authOptional(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      want("report_id", getReportIdFetchRid, assignToPCustom("rid")),
      want("until", getInt, assignToP),
      handle_GET_conversationStats
    );

    app.get(
      "/api/v3/snapshot",
      moveToBody,
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      handle_GET_snapshot
    );

    // this endpoint isn't really ready for general use TODO_SECURITY
    app.get(
      "/api/v3/facebook/delete",
      moveToBody,
      auth(assignToP),
      handle_GET_facebook_delete
    );

    app.post(
      "/api/v3/auth/facebook",
      enableAgid,
      authOptional(assignToP),
      want("fb_granted_scopes", getStringLimitLength(1, 9999), assignToP),
      want("fb_friends_response", getStringLimitLength(1, 99999), assignToP),
      want("fb_public_profile", getStringLimitLength(1, 99999), assignToP),
      want("fb_email", getEmail, assignToP),
      want("hname", getOptionalStringLimitLength(9999), assignToP),
      want("provided_email", getEmail, assignToP),
      want("conversation_id", getOptionalStringLimitLength(999), assignToP),
      want("password", getPassword, assignToP),
      need("response", getStringLimitLength(1, 9999), assignToP),
      want("owner", getBool, assignToP, true),
      handle_POST_auth_facebook
    );

    app.post(
      "/api/v3/auth/new",
      want("anon", getBool, assignToP),
      want("password", getPasswordWithCreatePasswordRules, assignToP),
      want("password2", getPasswordWithCreatePasswordRules, assignToP),
      want("email", getOptionalStringLimitLength(999), assignToP),
      want("hname", getOptionalStringLimitLength(999), assignToP),
      want("oinvite", getOptionalStringLimitLength(999), assignToP),
      want("encodedParams", getOptionalStringLimitLength(9999), assignToP), // TODO_SECURITY we need to add an additional key param to ensure this is secure. we don't want anyone adding themselves to other people's site_id groups.
      want("zinvite", getOptionalStringLimitLength(999), assignToP),
      want("organization", getOptionalStringLimitLength(999), assignToP),
      want("gatekeeperTosPrivacy", getBool, assignToP),
      want("owner", getBool, assignToP, true),
      handle_POST_auth_new
    );

    app.post(
      "/api/v3/tutorial",
      auth(assignToP),
      need("step", getInt, assignToP),
      handle_POST_tutorial
    );

    app.get(
      "/api/v3/users",
      moveToBody,
      authOptional(assignToP),
      want("errIfNoAuth", getBool, assignToP),
      handle_GET_users
    );

    app.get(
      "/api/v3/participation",
      moveToBody,
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      want("strict", getBool, assignToP),
      handle_GET_participation
    );

    app.get(
      "/api/v3/group_demographics",
      moveToBody,
      authOptional(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      want("report_id", getReportIdFetchRid, assignToPCustom("rid")),
      handle_GET_groupDemographics
    );

    app.get(
      "/api/v3/comments",
      moveToBody,
      authOptional(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      want("report_id", getReportIdFetchRid, assignToPCustom("rid")), // if you want to get report-specific info
      want("tids", getArrayOfInt, assignToP),
      want("moderation", getBool, assignToP),
      want("mod", getInt, assignToP),
      want("modIn", getBool, assignToP), // set this to true if you want to see the comments that are ptpt-visible given the current "strict mod" setting, or false for ptpt-invisible comments.
      want("mod_gt", getInt, assignToP),
      want("include_social", getBool, assignToP),
      want("include_demographics", getBool, assignToP),
      //    need('lastServerToken', _.identity, assignToP),
      want("include_voting_patterns", getBool, assignToP, false),
      resolve_pidThing(
        "not_voted_by_pid",
        assignToP,
        "get:comments:not_voted_by_pid"
      ),
      resolve_pidThing(
        "submitted_by_pid",
        assignToP,
        "get:comments:submitted_by_pid"
      ),
      resolve_pidThing("pid", assignToP, "get:comments:pid"),
      handle_GET_comments
    );

    // TODO probably need to add a retry mechanism like on joinConversation to handle possibility of duplicate tid race-condition exception
    app.post(
      "/api/v3/comments",
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      want("txt", getOptionalStringLimitLength(997), assignToP),
      want("vote", getIntInRange(-1, 1), assignToP),
      want("twitter_tweet_id", getStringLimitLength(999), assignToP),
      want("quote_twitter_screen_name", getStringLimitLength(999), assignToP),
      want("quote_txt", getStringLimitLength(999), assignToP),
      want("quote_src_url", getUrlLimitLength(999), assignToP),
      want("anon", getBool, assignToP),
      want("is_seed", getBool, assignToP),
      want("xid", getStringLimitLength(1, 999), assignToP),
      resolve_pidThing("pid", assignToP, "post:comments"),
      handle_POST_comments
    );

    app.get(
      "/api/v3/comments/translations",
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      want("tid", getInt, assignToP),
      want("lang", getStringLimitLength(1, 10), assignToP),
      handle_GET_comments_translations
    );

    app.get(
      "/api/v3/votes/me",
      moveToBody,
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      handle_GET_votes_me
    );

    app.get(
      "/api/v3/votes",
      moveToBody,
      authOptional(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      want("tid", getInt, assignToP),
      resolve_pidThing("pid", assignToP, "get:votes"),
      handle_GET_votes
    );

    app.get(
      "/api/v3/nextComment",
      timeout(15000),
      moveToBody,
      authOptional(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      resolve_pidThing("not_voted_by_pid", assignToP, "get:nextComment"),
      want("without", getArrayOfInt, assignToP),
      want("include_social", getBool, assignToP),
      want("lang", getStringLimitLength(1, 10), assignToP), // preferred language of nextComment
      haltOnTimeout,
      handle_GET_nextComment
    );

    app.get("/api/v3/testConnection", moveToBody, handle_GET_testConnection);

    app.get("/api/v3/testDatabase", moveToBody, handle_GET_testDatabase);

    app.get(
      "/api/v3/participationInit",
      moveToBody,
      authOptional(assignToP),
      want("ptptoiLimit", getInt, assignToP),
      want(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      want("conversation_id", getStringLimitLength(1, 1000), assignToP), // we actually need conversation_id to build a url
      want("lang", getStringLimitLength(1, 10), assignToP), // preferred language of nextComment

      want(
        "domain_whitelist_override_key",
        getStringLimitLength(1, 1000),
        assignToP
      ),
      denyIfNotFromWhitelistedDomain, // this seems like the easiest place to enforce the domain whitelist. The index.html is cached on cloudflare, so that's not the right place.

      want("xid", getStringLimitLength(1, 999), assignToP),
      resolve_pidThing("pid", assignToP, "get:votes"), // must be after zid getter
      handle_GET_participationInit
    );

    app.post(
      "/api/v3/votes",
      auth(assignToP),
      need("tid", getInt, assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      need("vote", getIntInRange(-1, 1), assignToP),
      want("starred", getBool, assignToP),
      want("high_priority", getBool, assignToP, false),
      want("weight", getNumberInRange(-1, 1), assignToP, 0),
      resolve_pidThing("pid", assignToP, "post:votes"),
      want("xid", getStringLimitLength(1, 999), assignToP),
      want("lang", getStringLimitLength(1, 10), assignToP), // language of the next comment to be returned
      handle_POST_votes
    );

    app.put(
      "/api/v3/participants_extended",
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      want("show_translation_activated", getBool, assignToP),
      handle_PUT_participants_extended
    );

    app.get(
      "/api/v3/logMaxmindResponse",
      auth(assignToP),
      need("user_uid", getInt, assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      handle_GET_logMaxmindResponse
    );

    app.post(
      "/api/v3/ptptCommentMod",
      auth(assignToP),
      need("tid", getInt, assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      want("as_abusive", getBool, assignToP, null),
      want("as_factual", getBool, assignToP, null),
      want("as_feeling", getBool, assignToP, null),
      want("as_important", getBool, assignToP, null),
      want("as_notfact", getBool, assignToP, null),
      want("as_notgoodidea", getBool, assignToP, null),
      want("as_notmyfeeling", getBool, assignToP, null),
      want("as_offtopic", getBool, assignToP, null),
      want("as_spam", getBool, assignToP, null),
      want("as_unsure", getBool, assignToP, null),
      getPidForParticipant(assignToP, pidCache),
      handle_POST_ptptCommentMod
    );

    app.post(
      "/api/v3/upvotes",
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      handle_POST_upvotes
    );

    app.post(
      "/api/v3/stars",
      auth(assignToP),
      need("tid", getInt, assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      need("starred", getIntInRange(0, 1), assignToP),
      getPidForParticipant(assignToP, pidCache),
      handle_POST_stars
    );

    app.post(
      "/api/v3/trashes",
      auth(assignToP),
      need("tid", getInt, assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      need("trashed", getIntInRange(0, 1), assignToP),
      getPidForParticipant(assignToP, pidCache),
      handle_POST_trashes
    );

    app.put(
      "/api/v3/comments",
      moveToBody,
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      need("tid", getInt, assignToP),
      need("active", getBool, assignToP),
      need("mod", getInt, assignToP),
      need("is_meta", getBool, assignToP),
      need("velocity", getNumberInRange(0, 1), assignToP),
      handle_PUT_comments
    );

    app.post(
      "/api/v3/reportCommentSelections",
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      need("report_id", getReportIdFetchRid, assignToPCustom("rid")),
      need("tid", getInt, assignToP),
      need("include", getBool, assignToP),
      handle_POST_reportCommentSelections
    );

    app.post(
      "/api/v3/conversation/close",
      moveToBody,
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      handle_POST_conversation_close
    );

    app.post(
      "/api/v3/conversation/reopen",
      moveToBody,
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      handle_POST_conversation_reopen
    );

    app.put(
      "/api/v3/conversations",
      moveToBody,
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      need("conversation_id", getStringLimitLength(1, 1000), assignToP), // we actually need conversation_id to build a url
      want("is_active", getBool, assignToP),
      want("is_anon", getBool, assignToP),
      want("is_draft", getBool, assignToP, false),
      want("is_data_open", getBool, assignToP, false),
      want("owner_sees_participation_stats", getBool, assignToP, false),
      want("profanity_filter", getBool, assignToP),
      want("short_url", getBool, assignToP, false),
      want("spam_filter", getBool, assignToP),
      want("strict_moderation", getBool, assignToP),
      want("topic", getOptionalStringLimitLength(400), assignToP),
      want("description", getOptionalStringLimitLength(5000), assignToP),
      want("survey_caption", getOptionalStringLimitLength(1024), assignToP, ""),
      want("postsurvey", getOptionalStringLimitLength(5000), assignToP, ""),
      want("postsurvey_limit", getInt, assignToP, null),
      want("postsurvey_submissions", getInt, assignToP, null),
      want(
        "postsurvey_redirect",
        getOptionalStringLimitLength(1024),
        assignToP,
        ""
      ),
      want("vis_type", getInt, assignToP),
      want("help_type", getInt, assignToP),
      want("write_type", getInt, assignToP),
      want("socialbtn_type", getInt, assignToP),
      want("importance_enabled", getBool, assignToP, false),
      want("bgcolor", getOptionalStringLimitLength(20), assignToP),
      want("help_color", getOptionalStringLimitLength(20), assignToP),
      want("help_bgcolor", getOptionalStringLimitLength(20), assignToP),
      want("style_btn", getOptionalStringLimitLength(500), assignToP),
      want("auth_needed_to_vote", getBool, assignToP),
      want("auth_needed_to_write", getBool, assignToP),
      want("auth_opt_fb", getBool, assignToP),
      want("auth_opt_tw", getBool, assignToP),
      want("auth_opt_allow_3rdparty", getBool, assignToP),
      want("verifyMeta", getBool, assignToP),
      want("send_created_email", getBool, assignToP), // ideally the email would be sent on the post, but we post before they click create to allow owner to prepopulate comments.
      want("context", getOptionalStringLimitLength(999), assignToP),
      want("link_url", getStringLimitLength(1, 9999), assignToP),
      want("subscribe_type", getInt, assignToP),
      handle_PUT_conversations
    );

    app.put(
      "/api/v3/users",
      moveToBody,
      auth(assignToP),
      want("email", getEmail, assignToP),
      want("hname", getOptionalStringLimitLength(9999), assignToP),
      want("uid_of_user", getInt, assignToP),
      handle_PUT_users
    );

    app.delete(
      "/api/v3/metadata/questions/:pmqid",
      moveToBody,
      auth(assignToP),
      need("pmqid", getInt, assignToP),
      handle_DELETE_metadata_questions
    );

    app.delete(
      "/api/v3/metadata/answers/:pmaid",
      moveToBody,
      auth(assignToP),
      need("pmaid", getInt, assignToP),
      handle_DELETE_metadata_answers
    );

    app.get(
      "/api/v3/metadata/questions",
      moveToBody,
      authOptional(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      want("suzinvite", getOptionalStringLimitLength(32), assignToP),
      want("zinvite", getOptionalStringLimitLength(300), assignToP),
      // TODO want('lastMetaTime', getInt, assignToP, 0),
      handle_GET_metadata_questions
    );

    app.post(
      "/api/v3/metadata/questions",
      moveToBody,
      auth(assignToP),
      need("key", getOptionalStringLimitLength(999), assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      handle_POST_metadata_questions
    );

    app.post(
      "/api/v3/metadata/answers",
      moveToBody,
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      need("pmqid", getInt, assignToP),
      need("value", getOptionalStringLimitLength(999), assignToP),
      handle_POST_metadata_answers
    );

    app.get(
      "/api/v3/metadata/choices",
      moveToBody,
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      handle_GET_metadata_choices
    );

    app.get(
      "/api/v3/metadata/answers",
      moveToBody,
      authOptional(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      want("pmqid", getInt, assignToP),
      want("suzinvite", getOptionalStringLimitLength(32), assignToP),
      want("zinvite", getOptionalStringLimitLength(300), assignToP),
      // TODO want('lastMetaTime', getInt, assignToP, 0),
      handle_GET_metadata_answers
    );

    app.get(
      "/api/v3/metadata",
      moveToBody,
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      want("zinvite", getOptionalStringLimitLength(300), assignToP),
      want("suzinvite", getOptionalStringLimitLength(32), assignToP),
      // TODO want('lastMetaTime', getInt, assignToP, 0),
      handle_GET_metadata
    );

    app.get(
      "/api/v3/conversations",
      moveToBody,
      authOptional(assignToP),
      want("include_all_conversations_i_am_in", getBool, assignToP),
      want("is_active", getBool, assignToP),
      want("is_draft", getBool, assignToP),
      want("course_invite", getStringLimitLength(1, 32), assignToP),
      want(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      want("want_upvoted", getBool, assignToP),
      want("want_mod_url", getBool, assignToP), // NOTE - use this for API only!
      want("want_inbox_item_admin_url", getBool, assignToP), // NOTE - use this for API only!
      want("want_inbox_item_participant_url", getBool, assignToP), // NOTE - use this for API only!
      want("want_inbox_item_admin_html", getBool, assignToP), // NOTE - use this for API only!
      want("want_inbox_item_participant_html", getBool, assignToP), // NOTE - use this for API only!
      want("limit", getIntInRange(1, 9999), assignToP), // not allowing a super high limit to prevent DOS attacks
      want("context", getStringLimitLength(1, 999), assignToP),
      want("xid", getStringLimitLength(1, 999), assignToP),
      handle_GET_conversations
    );

    app.get(
      "/api/v3/reports",
      moveToBody,
      authOptional(assignToP),
      want(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      want("report_id", getReportIdFetchRid, assignToPCustom("rid")), // Knowing the report_id grants the user permission to view the report
      handle_GET_reports
    );

    app.post(
      "/api/v3/reports",
      auth(assignToP),
      want(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      handle_POST_reports
    );

    app.put(
      "/api/v3/reports",
      moveToBody,
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      need("report_id", getReportIdFetchRid, assignToPCustom("rid")),
      want("report_name", getStringLimitLength(999), assignToP),
      want("label_x_neg", getStringLimitLength(999), assignToP),
      want("label_x_pos", getStringLimitLength(999), assignToP),
      want("label_y_neg", getStringLimitLength(999), assignToP),
      want("label_y_pos", getStringLimitLength(999), assignToP),
      want("label_group_0", getStringLimitLength(999), assignToP),
      want("label_group_1", getStringLimitLength(999), assignToP),
      want("label_group_2", getStringLimitLength(999), assignToP),
      want("label_group_3", getStringLimitLength(999), assignToP),
      want("label_group_4", getStringLimitLength(999), assignToP),
      want("label_group_5", getStringLimitLength(999), assignToP),
      want("label_group_6", getStringLimitLength(999), assignToP),
      want("label_group_7", getStringLimitLength(999), assignToP),
      want("label_group_8", getStringLimitLength(999), assignToP),
      want("label_group_9", getStringLimitLength(999), assignToP),
      handle_PUT_reports
    );

    app.get(
      "/api/v3/contexts",
      moveToBody,
      authOptional(assignToP),
      handle_GET_contexts
    );

    app.post(
      "/api/v3/contexts",
      auth(assignToP),
      need("name", getStringLimitLength(1, 300), assignToP),
      handle_POST_contexts
    );

    app.post(
      "/api/v3/reserve_conversation_id",
      auth(assignToP),
      handle_POST_reserve_conversation_id
    );

    // TODO check to see if ptpt has answered necessary metadata questions.
    app.post(
      "/api/v3/conversations",
      auth(assignToP),
      want("is_active", getBool, assignToP, true),
      want("is_draft", getBool, assignToP, false),
      want("is_anon", getBool, assignToP, false),
      want("owner_sees_participation_stats", getBool, assignToP, false),
      want("profanity_filter", getBool, assignToP, true),
      want("short_url", getBool, assignToP, false),
      want("spam_filter", getBool, assignToP, true),
      want("strict_moderation", getBool, assignToP, false),
      want("context", getOptionalStringLimitLength(999), assignToP, ""),
      want("topic", getOptionalStringLimitLength(400), assignToP, ""),
      want("description", getOptionalStringLimitLength(5000), assignToP, ""),
      want("survey_caption", getOptionalStringLimitLength(1024), assignToP, ""),
      want("postsurvey", getOptionalStringLimitLength(5000), assignToP, ""),
      want("postsurvey_limit", getInt, assignToP, null),
      want("postsurvey_submissions", getInt, assignToP, null),
      want(
        "postsurvey_redirect",
        getOptionalStringLimitLength(1024),
        assignToP,
        ""
      ),
      want("conversation_id", getStringLimitLength(6, 300), assignToP, ""),
      want("is_data_open", getBool, assignToP, false),
      want("ownerXid", getStringLimitLength(1, 999), assignToP),
      handle_POST_conversations
    );

    app.post(
      "/api/v3/query_participants_by_metadata",
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      need("pmaids", getArrayOfInt, assignToP),
      handle_POST_query_participants_by_metadata
    );

    app.post(
      "/api/v3/sendCreatedLinkToEmail",
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      handle_POST_sendCreatedLinkToEmail
    );

    app.get(
      "/api/v3/twitterBtn",
      moveToBody,
      authOptional(assignToP),
      want("dest", getStringLimitLength(9999), assignToP),
      want("owner", getBool, assignToP, true),
      handle_GET_twitterBtn
    );

    app.get(
      "/api/v3/twitter_oauth_callback",
      moveToBody,
      enableAgid,
      auth(assignToP),
      need("dest", getStringLimitLength(9999), assignToP),
      need("oauth_token", getStringLimitLength(9999), assignToP), // TODO verify
      need("oauth_verifier", getStringLimitLength(9999), assignToP), // TODO verify
      want("owner", getBool, assignToP, true),
      handle_GET_twitter_oauth_callback
    );

    app.get(
      "/api/v3/locations",
      moveToBody,
      authOptional(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      need("gid", getInt, assignToP),
      handle_GET_locations
    );

    app.put(
      "/api/v3/ptptois",
      moveToBody,
      auth(assignToP),
      need("mod", getInt, assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      resolve_pidThing("pid", assignToP),
      handle_PUT_ptptois
    );

    app.get(
      "/api/v3/ptptois",
      moveToBody,
      authOptional(assignToP),
      want("mod", getInt, assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      need("conversation_id", getStringLimitLength(1, 1000), assignToP),
      handle_GET_ptptois
    );

    app.get(
      "/api/v3/twitter_users",
      moveToBody,
      authOptional(assignToP),
      want("twitter_user_id", getInt, assignToP), // if not provided, returns info for the signed-in user
      handle_GET_twitter_users
    );

    app.post(
      "/api/v3/einvites",
      need("email", getEmail, assignToP),
      handle_POST_einvites
    );

    app.get(
      "/api/v3/einvites",
      moveToBody,
      need("einvite", getStringLimitLength(1, 100), assignToP),
      handle_GET_einvites
    );

    app.post(
      "/api/v3/users/invite",
      // authWithApiKey(assignToP),
      auth(assignToP),
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      need("conversation_id", getStringLimitLength(1, 1000), assignToP), // we actually need conversation_id to build a url
      // need('single_use_tokens', getBool, assignToP),
      need("emails", getArrayOfStringNonEmpty, assignToP),
      handle_POST_users_invite
    );

    // TODO this should probably be exempt from the CORS restrictions
    app.get(
      "/api/v3/launchPrep",
      moveToBody,
      need("dest", getStringLimitLength(1, 10000), assignToP),
      handle_GET_launchPrep
    );

    app.get("/api/v3/tryCookie", moveToBody, handle_GET_tryCookie);

    app.get(
      "/api/v3/verify",
      moveToBody,
      need("e", getStringLimitLength(1, 1000), assignToP),
      handle_GET_verification
    );

    app.post(
      "/api/v3/contributors",
      authOptional(assignToP),
      need("agreement_version", getIntInRange(1, 999999), assignToP),
      need("name", getStringLimitLength(746), assignToP),
      need("email", getStringLimitLength(256), assignToP),
      need("github_id", getStringLimitLength(256), assignToP),
      need("company_name", getStringLimitLength(746), assignToP),
      handle_POST_contributors
    );

    app.post(
      "/api/v3/metrics",
      authOptional(assignToP),
      need("types", getArrayOfInt, assignToP),
      need("times", getArrayOfInt, assignToP),
      need("durs", getArrayOfInt, assignToP),
      need("clientTimestamp", getInt, assignToP),
      handle_POST_metrics
    );

    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    //
    // BEGIN USER ROUTES
    //
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////

    // inbox item participant
    app.get(
      "/iip/:conversation_id",
      moveToBody,
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      handle_GET_iip_conversation
    );

    // inbox item admin
    app.get(
      "/iim/:conversation_id",
      moveToBody,
      need(
        "conversation_id",
        getConversationIdFetchZid,
        assignToPCustom("zid")
      ),
      handle_GET_iim_conversation
    );

    app.get("/robots.txt", (req: express.Request, res: express.Response) => {
      res.send("User-agent: *\n" + "Disallow: /api/");
    });

    // const fetchIndexForAdminPage = express.static(
    //   path.join(__dirname, "build", "index.html")
    // );

    express.static.mime.define({ "text/html": ["html"] });

    const fetchIndexForAdminPage = (
      req: express.Request,
      res: express.Response
    ) => {
      res.setHeader("Content-Type", "text/html");
      res.sendfile(__dirname + "/client/index.html");
    };

    app.get("^/$", fetchIndexForAdminPage);
    app.get(/^\/home(\/.*)?/, fetchIndexForAdminPage);
    app.get(/^\/signin(\/.*)?/, fetchIndexForAdminPage);
    app.get(/^\/signout(\/.*)?/, fetchIndexForAdminPage);
    app.get(/^\/createuser(\/.*)?/, fetchIndexForAdminPage);
    app.get(/^\/pwreset.*/, fetchIndexForAdminPage);
    app.get(/^\/pwresetinit.*/, fetchIndexForAdminPage);
    app.get(/^\/tos$/, fetchIndexForAdminPage);
    app.get(/^\/privacy$/, fetchIndexForAdminPage);

    app.get(/^\/conversations(\/.*)?/, fetchIndexForAdminPage);
    app.get(/^\/account(\/.*)?/, fetchIndexForAdminPage);
    app.get(/^\/m\/[0-9][0-9A-Za-z]+(\/.*)?/, fetchIndexForAdminPage);
    app.get(/^\/c\/[0-9][0-9A-Za-z]+(\/.*)?/, fetchIndexForAdminPage);
    app.get(/^\/r\/[0-9][0-9A-Za-z]+(\/.*)?/, fetchIndexForAdminPage);

    app.use(express.static(path.join(__dirname, "client")));

    const fetchEmbed = (req: express.Request, res: express.Response) => {
      const isIndex = req.path === "/embed";
      const isEmbedJs = req.path === "/embed.js";
      const isConversation = req.path.match(/^\/embed\/[a-z0-9]+$/);

      // embed.js is on a different root path
      if (isEmbedJs) {
        const headers = fs.readFileSync(
          __dirname + "/embed/embed.js.headersJson",
          {
            encoding: "utf8",
          }
        );
        res.set(JSON.parse(headers));
        res.sendfile(__dirname + "/embed/embed.js");
        return;
      }

      // conversations need preload data
      const path = isIndex || isConversation ? "/embed/index.html" : req.path;
      const headers = fs.readFileSync(__dirname + path + ".headersJson", {
        encoding: "utf8",
      });
      res.set(JSON.parse(headers));
      if (isConversation) {
        const conversation_id = req.path.match(/^\/embed\/([0-9a-z]+)$/)![1];
        doGetConversationPreloadInfo(conversation_id).then(function (x: any) {
          const file = fs.readFileSync(__dirname + path, { encoding: "utf8" });
          const preloadData = JSON.stringify({ conversation: x });
          res.send(
            file
              .toString()
              .replace('"REPLACE_THIS_WITH_PRELOAD_DATA"', preloadData)
          );
        });
        return;
      }
      // all other files just need headers
      res.sendfile(__dirname + path);
    };

    app.get(/^\/embed$/, fetchEmbed);
    app.get(/^\/embed.js$/, fetchEmbed);
    app.get(/^\/embed\/(.*)/, fetchEmbed);

    // app.get(/^\/thirdPartyCookieTestPt1\.html$/, fetchThirdPartyCookieTestPt1);
    // app.get(/^\/thirdPartyCookieTestPt2\.html$/, fetchThirdPartyCookieTestPt2);

    // app.get(
    //   /^\/twitterAuthReturn(\/.*)?$/,
    //   makeFileFetcher(hostname, staticFilesPort, "/twitterAuthReturn.html", {
    //     "Content-Type": "text/html",
    //   })
    // );

    app.listen(Config.serverPort);
    logger.info("started on port " + Config.serverPort);
  },

  function (err) {
    logger.error("failed to init server", err);
  }
);

export default app;
