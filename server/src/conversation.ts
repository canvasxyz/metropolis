import LruCache from "lru-cache";

import pg from "./db/pg-query";
import { meteredPromise } from "./utils/metered";
import logger from "./utils/logger";

function createXidRecord(
  ownerUid: any,
  uid: any,
  xid: any,
  x_profile_image_url: any,
  x_name: any,
  x_email: any,
) {
  return pg.queryP(
    "insert into xids (owner, uid, xid, x_profile_image_url, x_name, x_email) values ($1, $2, $3, $4, $5, $6) " +
      "on conflict (owner, xid) do nothing;",
    [
      ownerUid,
      uid,
      xid,
      x_profile_image_url || null,
      x_name || null,
      x_email || null,
    ],
  );
}

async function createXidRecordByZid(
  zid: any,
  uid: any,
  xid: any,
  x_profile_image_url: any,
  x_name: any,
  x_email: any,
) {
  const conv = (await getConversationInfo(zid)) as {
    use_xid_whitelist: any;
    owner: any;
  };

  const shouldCreateXidRecord = conv.use_xid_whitelist
    ? isXidWhitelisted(conv.owner, xid)
    : Promise.resolve(true);

  const should = await shouldCreateXidRecord;

  if (!should) {
    throw new Error("polis_err_xid_not_whitelisted_2");
  }
  return pg.queryP(
    "insert into xids (owner, uid, xid, x_profile_image_url, x_name, x_email) values ((select org_id from conversations where zid = ($1)), $2, $3, $4, $5, $6) " +
      "on conflict (owner, xid) do nothing;",
    [
      zid,
      uid,
      xid,
      x_profile_image_url || null,
      x_name || null,
      x_email || null,
    ],
  );
}

function getXidRecord(xid: any, zid: any) {
  return pg.queryP(
    "select * from xids where xid = ($1) and owner = (select org_id from conversations where zid = ($2));",
    [xid, zid],
  );
}

function isXidWhitelisted(owner: any, xid: any) {
  return pg
    .queryP("select * from xid_whitelist where owner = ($1) and xid = ($2);", [
      owner,
      xid,
    ])
    .then((rows: string | any[]) => {
      return !!rows && rows.length > 0;
    });
}

async function getConversationInfo(zid: any) {
  return meteredPromise(
    "getConversationInfo",
    (async () => {
      const rows = await pg.queryP(
        "SELECT * FROM conversations WHERE zid = ($1);",
        [zid],
      );
      return rows[0];
    })(),
  );
}

function getConversationInfoByConversationId(conversation_id: any) {
  return meteredPromise(
    "getConversationInfoByConversationId",
    (async () => {
      const rows = await pg.queryP(
        "SELECT * FROM conversations WHERE zid = (select zid from zinvites where zinvite = ($1));",
        [conversation_id],
      );
      return rows[0];
    })(),
  );
}

const conversationIdToZidCache = new LruCache({
  max: 1000,
});

// NOTE: currently conversation_id is stored as zinvite
function getZidFromConversationId(conversation_id: string) {
  return meteredPromise(
    "getZidFromConversationId",
    (async () => {
      let cachedZid = conversationIdToZidCache.get(conversation_id);
      if (cachedZid) {
        return cachedZid;
      }

      const results = await pg.queryP_readOnly(
        "select zid from zinvites where zinvite = ($1);",
        [conversation_id],
      );

      if (results.length == 0) {
        logger.error(
          "polis_err_fetching_zid_for_conversation_id " + conversation_id,
        );
        throw Error("polis_err_fetching_zid_for_conversation_id");
      } else {
        const zid = results[0].zid;
        conversationIdToZidCache.set(conversation_id, zid);
        return zid;
      }
    })(),
  );
}

export {
  createXidRecord,
  createXidRecordByZid,
  getXidRecord,
  isXidWhitelisted,
  getConversationInfo,
  getConversationInfoByConversationId,
  getZidFromConversationId,
};
