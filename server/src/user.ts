import _ from "underscore";
import LruCache from "lru-cache";

import pg from "./db/pg-query";
import { meteredPromise } from "./utils/metered";

import {
  getXidRecord,
  getConversationInfo,
  isXidWhitelisted,
  createXidRecord,
} from "./conversation";
import LRUCache from "lru-cache";
import logger from "./utils/logger";
import Config from "./config";

const polisDevs = Config.adminUIDs ? JSON.parse(Config.adminUIDs) : [];

async function getUserInfoForUid(uid: any) {
  const results = await pg.queryP_readOnly(
    "SELECT email, hname from users where uid = $1",
    [uid]
  );
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
      const results = (await pg.queryP_readOnly(
        "SELECT * from users where uid = $1",
        [uid]
      )) as string | any[];
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

  let xidInfoPromise = Promise.resolve<string | any[] | null>([]);
  if (zid_optional && xid_optional) {
    xidInfoPromise = getXidRecord(xid_optional, zid_optional);
  } else if (xid_optional && owner_uid_optional) {
    xidInfoPromise = getXidRecordByXidOwnerId(
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
    githubUserId: info.github_user_id,
    githubUsername: info.github_username,
    hname: info.hname,
    hasXid: !!hasXid,
    xInfo: xInfo && xInfo[0],
    finishedTutorial: !!info.tut,
    site_ids: [info.site_id],
    created: Number(info.created),
    isRepoCollaborator: info.is_repo_collaborator,
  };
}

function createDummyUser() {
  return meteredPromise(
    "createDummyUser",
    (async () => {
      let results;

      try {
        results = await pg.queryP(
          "INSERT INTO users (created) VALUES (default) RETURNING uid;",
          []
        );
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
      f("SELECT pid FROM participants WHERE zid = ($1) AND uid = ($2);", [
        zid,
        uid,
      ])
        .then((rows) => {
          if (!rows.length) {
            resolve(-1);
            return;
          }
          let pid = rows[0].pid;
          pidCache.set(cacheKey, pid);
          resolve(pid);
        })
        .catch((err) => reject(err));
    })
  );
}

// must follow auth and need('zid'...) middleware
function getPidForParticipant(
  assigner: (arg0: any, arg1: string, arg2: any) => void
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
  x_profile_image_url?: string,
  x_name?: string,
  x_email?: string,
  createIfMissing?: boolean
) {
  return pg
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
          : getConversationInfo(zid_optional).then(
              (conv: { use_xid_whitelist: any }) => {
                return conv.use_xid_whitelist
                  ? isXidWhitelisted(owner, xid)
                  : Promise.resolve(true);
              }
            );

        return shouldCreateXidEntryPromise.then((should: any) => {
          if (!should) {
            return null;
          }
          return createDummyUser().then((newUid: any) => {
            return createXidRecord(
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
    });
}

function getXidStuff(xid: any, zid: any) {
  return getXidRecord(xid, zid).then((rows: string | any[]) => {
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

function isAdministrator(uid: number) {
  return polisDevs.indexOf(uid) >= 0;
}

async function isRepoCollaborator(uid: number) {
  // get user
  const user = await getUserInfoForUid2(uid);
  return user.is_repo_collaborator;
}

async function isOwner(zid: number, uid: number) {
  if (isAdministrator(uid)) {
    // admins are owners of everything
    return true;
  }

  if (await isRepoCollaborator(uid)) {
    return true;
  }

  return (await getConversationInfo(zid)).owner === uid;
}

async function isOwnerOrParticipant(zid: any, uid?: any) {
  let pid;
  try {
    pid = await getPidPromise(zid, uid);
  } catch (err) {
    return false;
  }
  if (pid < 0) {
    return false;
  }
  return await isOwner(zid, uid);
}

export {
  pidCache,
  getXidRecordByXidOwnerId,
  getXidStuff,
  getUserInfoForUid,
  getUserInfoForUid2,
  getUser,
  createDummyUser,
  getPidPromise,
  getPidForParticipant,
  isRepoCollaborator,
  isAdministrator,
  isOwner,
  isOwnerOrParticipant,
};
