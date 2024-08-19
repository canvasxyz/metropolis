import crypto from "crypto";
import LruCache from "lru-cache";

import Config from "./config";
import pg from "./db/pg-query";
import logger from "./utils/logger";

function encrypt(text: string | null) {
  const algorithm = "aes-256-ctr";
  const password = Config.encryptionPassword;
  //
  // TODO replace deprecated createCipher method with current createCipheriv method
  //
  //  function createCipher(algorithm: crypto.CipherCCMTypes, password: crypto.BinaryLike, options: crypto.CipherCCMOptions): crypto.CipherCCM (+2 overloads)
  //
  // @deprecated — since v10.0.0 use createCipheriv()
  //
  // The signature '(algorithm: string, password: BinaryLike, options: TransformOptions | undefined): CipherCCM & CipherGCM & Cipher' of 'crypto.createCipher' is deprecated.ts(6387)
  // crypto.d.ts(207, 9): The declaration was marked as deprecated here.
  // No overload matches this call.
  //   Overload 1 of 3, '(algorithm: CipherGCMTypes, password: BinaryLike, options?: CipherGCMOptions | undefined): CipherGCM', gave the following error.
  //     Argument of type '"aes-256-ctr"' is not assignable to parameter of type 'CipherGCMTypes'.
  //   Overload 2 of 3, '(algorithm: string, password: BinaryLike, options?: TransformOptions | undefined): Cipher', gave the following error.
  //     Argument of type 'string | undefined' is not assignable to parameter of type 'BinaryLike'.
  //       Type 'undefined' is not assignable to type 'BinaryLike'.ts(2769)
  // @ts-ignore
  const cipher = crypto.createCipher(algorithm, password);
  // No overload matches this call.
  // Overload 1 of 4, '(data: ArrayBufferView, input_encoding: undefined, output_encoding: Encoding): string', gave the following error.
  //   Argument of type 'string | null' is not assignable to parameter of type 'ArrayBufferView'.
  //     Type 'null' is not assignable to type 'ArrayBufferView'.
  // Overload 2 of 4, '(data: string, input_encoding: Encoding | undefined, output_encoding: Encoding): string', gave the following error.
  //   Argument of type 'string | null' is not assignable to parameter of type 'string'.
  //   Type 'null' is not assignable to type 'string'.ts(2769)
  // @ts-ignore
  let crypted = cipher.update(text, "utf8", "hex");
  // Type 'string' is not assignable to type 'Buffer & string'.
  // Type 'string' is not assignable to type 'Buffer'.ts(2322)
  // @ts-ignore
  crypted += cipher.final("hex");
  return crypted;
}

function decrypt(text: string) {
  const algorithm = "aes-256-ctr";
  const password = Config.encryptionPassword;
  //
  // TODO replace deprecated createDecipher method with current createDecipheriv method
  //
  //  function createDecipher(algorithm: crypto.CipherCCMTypes, password: crypto.BinaryLike, options: crypto.CipherCCMOptions): crypto.DecipherCCM (+2 overloads)
  //
  // @deprecated — since v10.0.0 use createDecipheriv()
  //
  // The signature '(algorithm: string, password: BinaryLike, options: TransformOptions | undefined): DecipherCCM & DecipherGCM & Decipher' of 'crypto.createDecipher' is deprecated.ts(6387)
  // crypto.d.ts(253, 9): The declaration was marked as deprecated here.
  // No overload matches this call.
  //   Overload 1 of 3, '(algorithm: CipherGCMTypes, password: BinaryLike, options?: CipherGCMOptions | undefined): DecipherGCM', gave the following error.
  //     Argument of type '"aes-256-ctr"' is not assignable to parameter of type 'CipherGCMTypes'.
  //   Overload 2 of 3, '(algorithm: string, password: BinaryLike, options?: TransformOptions | undefined): Decipher', gave the following error.
  //     Argument of type 'string | undefined' is not assignable to parameter of type 'BinaryLike'.ts(2769)
  // @ts-ignore
  const decipher = crypto.createDecipher(algorithm, password);
  let dec = decipher.update(text, "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;
}
decrypt; // appease linter
function makeSessionToken() {
  // These can probably be shortened at some point.
  return crypto
    .randomBytes(32)
    .toString("base64")
    .replace(/[^A-Za-z0-9]/g, "")
    .substr(0, 20);
}

// But we need to squeeze a bit more out of the db right now,
// and generally remove sources of uncertainty about what makes
// various queries slow. And having every single query talk to PG
// adds a lot of variability across the board.
const userTokenCache = new LruCache({
  max: 9000,
});

async function getUserInfoForSessionToken(sessionToken: unknown) {
  let cachedUid = userTokenCache.get(sessionToken);
  if (cachedUid) {
    return cachedUid;
  }

  let results;
  try {
    results = await pg.queryP(
      "select uid from auth_tokens where token = ($1);",
      [sessionToken]
    );
  } catch (err) {
    logger.error("token_fetch_error", err);
    throw new Error("token_fetch_error");
  }

  if (results.length == 0) {
    logger.error("token_expired_or_missing");
    throw new Error("token_expired_or_missing");
  }

  let uid = results[0].uid;
  userTokenCache.set(sessionToken, uid);
  return uid;
}

async function startSession(uid: any) {
  let token = makeSessionToken();
  logger.info("startSession");
  await pg.queryP(
    "insert into auth_tokens (uid, token, created) values ($1, $2, default);",
    [uid, token]
  );
  return token;
}

async function endSession(sessionToken: any) {
  await pg.queryP("delete from auth_tokens where token = ($1);", [
    sessionToken,
  ]);
}

async function setupPwReset(uid: any) {
  function makePwResetToken() {
    // These can probably be shortened at some point.
    return crypto
      .randomBytes(140)
      .toString("base64")
      .replace(/[^A-Za-z0-9]/g, "")
      .substr(0, 100);
  }
  let token = makePwResetToken();
  await pg.queryP(
    "insert into pwreset_tokens (uid, token, created) values ($1, $2, default);",
    [uid, token]
  );
}

async function getUidForPwResetToken(pwresettoken: any) {
  let results;
  try {
    // TODO "and created > timestamp - x"
    results = await pg.queryP(
      "select uid from pwreset_tokens where token = ($1);",
      [pwresettoken]
    );
  } catch (err) {
    logger.error("pwresettoken_fetch_error", err);
    throw new Error("pwresettoken_fetch_error");
  }

  if (results.length == 0) {
    logger.error("token_expired_or_missing");
    throw new Error("token_expired_or_missing");
  }

  let uid = results[0].uid;
  return { uid };
}

function clearPwResetToken(pwresettoken: any, cb: (arg0: null) => void) {
  pg.query(
    "delete from pwreset_tokens where token = ($1);",
    [pwresettoken],
    function (errDelToken: any) {
      if (errDelToken) {
        cb(errDelToken);
        return;
      }
      cb(null);
    }
  );
}

export {
  encrypt,
  decrypt,
  makeSessionToken,
  getUserInfoForSessionToken,
  startSession,
  endSession,
  setupPwReset,
  getUidForPwResetToken,
  clearPwResetToken,
};
