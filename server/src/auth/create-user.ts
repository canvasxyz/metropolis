import _ from "underscore"

import pg from "../db/pg-query"
import Config from "../config"
import { generateTokenP } from "./password"
import { sendTextEmail } from "../email/senders"

const polisFromAddress = Config.polisFromAddress
const getServerNameWithProtocol = Config.getServerNameWithProtocol

function doSendVerification(req: any, email: any) {
  return generateTokenP(30, false).then(function (einvite: any) {
    return pg
      .queryP("insert into einvites (email, einvite) values ($1, $2);", [
        email,
        einvite,
      ])
      .then(function () {
        return sendVerificationEmail(req, email, einvite)
      })
  })
}

function sendVerificationEmail(req: any, email: any, einvite: any) {
  let serverName = getServerNameWithProtocol(req)
  let body = `Welcome to pol.is!

Click this link to verify your email address:

${serverName}/api/v3/verify?e=${einvite}`

  return sendTextEmail(polisFromAddress, email, "Polis verification", body)
}

async function generateAndRegisterZinvite(zid: any, generateShort: any) {
  let len = 10
  if (generateShort) {
    len = 6
  }
  const zinvite = await generateTokenP(len, false)
  await pg.queryP(
    "INSERT INTO zinvites (zid, zinvite, created) VALUES ($1, $2, default);",
    [zid, zinvite],
  )
  return zinvite
}

export { doSendVerification, generateAndRegisterZinvite }

export default { doSendVerification, generateAndRegisterZinvite }
