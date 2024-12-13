import _ from "underscore"

import pg from "../db/pg-query"
import { generateTokenP } from "./password"

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

export { generateAndRegisterZinvite }

export default { generateAndRegisterZinvite }
