import _ from "underscore";
import LruCache from "lru-cache";

import pg from "./db/pg-query";
import { meteredPromise } from "./utils/metered";

import Conversation from "./conversation";
import LRUCache from "lru-cache";
import logger from "./utils/logger";

async function getUserInfoForUid(
  uid: any,
) {
  const results = await pg.queryP_readOnly("SELECT email, hname from users where uid = $1", [uid]);
  // what is the point of this????
  if (results.length == 0) {
    throw Error();
  }

  return results[0];
}

function getUserInfoForUid2(uid: any) {
  return meteredPromise(
    "getUserInfoForUid2",
    (async () => {
      const results = await pg.queryP_readOnly("SELECT * from users where uid = $1", [uid]) as string | any[];
      if (!results || !results.length) {
        throw Error();
      }
      return results[0];
    })()
  );
}

async function getUser(
  uid: number,
  zid_optional: any,
  xid_optional: any,
  owner_uid_optional: any
) {
  if (!uid) {
    // this api may be called by a new user, so we don't want to trigger a failure here.
    return Promise.resolve({});
  }

  let xidInfoPromise = Promise.resolve(null);
  if (zid_optional && xid_optional) {
    //     let xidInfoPromise: Promise<null>
    // Type 'Promise<unknown>' is not assignable to type 'Promise<null>'.
    //       Type 'unknown' is not assignable to type 'null'.ts(2322)
    // @ts-ignore
    xidInfoPromise = Conversation.getXidRecord(xid_optional, zid_optional);
  } else if (xid_optional && owner_uid_optional) {
    // let xidInfoPromise: Promise<null>
    // Type 'Promise<unknown>' is not assignable to type 'Promise<null>'.ts(2322)
    // @ts-ignore
    xidInfoPromise = Conversation.getXidRecordByXidOwnerId(
      xid_optional,
      owner_uid_optional,
      zid_optional
    );
  }

  const [info, xInfo]: any[] = await Promise.all([
    getUserInfoForUid2(uid),
    xidInfoPromise,
  ]);
  let hasXid = xInfo && xInfo.length && xInfo[0];

  if (hasXid) {
    delete xInfo[0].owner;
    delete xInfo[0].created;
    delete xInfo[0].uid;
  }
  return {
    uid: uid,
    email: info.email,
    hname: info.hname,
    hasXid: !!hasXid,
    xInfo: xInfo && xInfo[0],
    finishedTutorial: !!info.tut,
    site_ids: [info.site_id],
    created: Number(info.created),
  };
}

function createDummyUser() {
  return meteredPromise(
    "createDummyUser",
    (async () => {
      let results;

      try {
        results = await pg.queryP("INSERT INTO users (created) VALUES (default) RETURNING uid;", []);
      } catch (err) {
        throw new Error("polis_err_create_empty_user");
      }

      if (results.length == 0) {
        throw new Error("polis_err_create_empty_user");
      }

      return results[0].uid;
    })()
  );
}

let pidCache: LRUCache<string, number> = new LruCache({
  max: 9000,
});

// returns a pid of -1 if it's missing
function getPid(
  zid: string,
  uid: string,
  callback: (arg0: null, arg1: number) => void
) {
  let cacheKey = zid + "_" + uid;
  let cachedPid = pidCache.get(cacheKey);
  if (!_.isUndefined(cachedPid)) {
    callback(null, cachedPid);
    return;
  }
  pg.query_readOnly(
    "SELECT pid FROM participants WHERE zid = ($1) AND uid = ($2);",
    [zid, uid],
    function (err: any, docs: { rows: { pid: number }[] }) {
      let pid = -1;
      if (docs && docs.rows && docs.rows[0]) {
        pid = docs.rows[0].pid;
        pidCache.set(cacheKey, pid);
      }
      callback(err, pid);
    }
  );
}

// returns a pid of -1 if it's missing
function getPidPromise(zid: string, uid: string, usePrimary?: boolean) {
  let cacheKey = zid + "_" + uid;
  let cachedPid = pidCache.get(cacheKey);

  return meteredPromise(
    "getPidPromise",
    new Promise<number>(function (resolve, reject) {
      if (!_.isUndefined(cachedPid)) {
        resolve(cachedPid);
        return;
      }
      const f = usePrimary ? pg.queryP : pg.queryP_readOnly;
      f(
        "SELECT pid FROM participants WHERE zid = ($1) AND uid = ($2);",
        [zid, uid]
      ).then((rows) => {
        if (!rows.length) {
          resolve(-1);
          return;
        }
        let pid = rows[0].pid;
        pidCache.set(cacheKey, pid);
        resolve(pid);
      }).catch((err) => reject(err));
    }
  ));
}

// must follow auth and need('zid'...) middleware
function getPidForParticipant(
  assigner: (arg0: any, arg1: string, arg2: any) => void,
) {
  return function (
    req: { p: { zid: any; uid: any } },
    res: any,
    next: (arg0?: string) => void
  ) {
    let zid = req.p.zid;
    let uid = req.p.uid;

    function finish(pid: any) {
      assigner(req, "pid", pid);
      next();
    }
    getPidPromise(zid, uid).then(
      function (pid: number) {
        if (pid === -1) {
          let msg = "polis_err_get_pid_for_participant_missing";
          logger.error(msg, {
            zid,
            uid,
            p: req.p,
          });
          next(msg);
        }
        finish(pid);
      },
      function (err: any) {
        logger.error("polis_err_get_pid_for_participant", err);
        next(err);
      }
    );
  };
}


function getXidRecordByXidOwnerId(
  xid: any,
  owner: any,
  zid_optional: any,
  x_profile_image_url: any,
  x_name: any,
  x_email: any,
  createIfMissing: any
) {
  return (
    pg
      .queryP("select * from xids where xid = ($1) and owner = ($2);", [
        xid,
        owner,
      ])
      .then(function (rows: string | any[]) {
        if (!rows || !rows.length) {
          logger.warn("getXidRecordByXidOwnerId: no xInfo yet");
          if (!createIfMissing) {
            return null;
          }

          const shouldCreateXidEntryPromise = !zid_optional
            ? Promise.resolve(true)
            : Conversation.getConversationInfo(zid_optional).then(
                (conv: { use_xid_whitelist: any }) => {
                  return conv.use_xid_whitelist
                    ? Conversation.isXidWhitelisted(owner, xid)
                    : Promise.resolve(true);
                }
              );

          return shouldCreateXidEntryPromise.then((should: any) => {
            if (!should) {
              return null;
            }
            return createDummyUser().then((newUid: any) => {
              return Conversation.createXidRecord(
                owner,
                newUid,
                xid,
                x_profile_image_url || null,
                x_name || null,
                x_email || null
              ).then(() => {
                return [
                  {
                    uid: newUid,
                    owner: owner,
                    xid: xid,
                    x_profile_image_url: x_profile_image_url,
                    x_name: x_name,
                    x_email: x_email,
                  },
                ];
              });
            });
          });
        }
        return rows;
      })
  );
}

function getXidStuff(xid: any, zid: any) {
  return Conversation.getXidRecord(xid, zid).then((rows: string | any[]) => {
    if (!rows || !rows.length) {
      return "noXidRecord";
    }
    let xidRecordForPtpt = rows[0];
    if (xidRecordForPtpt) {
      return getPidPromise(zid, xidRecordForPtpt.uid, true).then(
        (pidForXid: any) => {
          xidRecordForPtpt.pid = pidForXid;
          return xidRecordForPtpt;
        }
      );
    }
    return xidRecordForPtpt;
  });
}

export {
  pidCache,
  getUserInfoForUid,
  getUserInfoForUid2,
  getUser,
  createDummyUser,
  getPid,
  getPidPromise,
  getPidForParticipant,
};

export default {
  pidCache,
  getXidRecordByXidOwnerId,
  getXidStuff,
  getUserInfoForUid,
  getUserInfoForUid2,
  getUser,
  createDummyUser,
  getPid,
  getPidPromise,
  getPidForParticipant,
};
