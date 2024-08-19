// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute
// it and / or  modify it under the terms of the GNU Affero General Public License, version 3,
// as published by the Free Software Foundation.This program is distributed in the hope that it
// will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
// or FITNESS FOR A PARTICULAR PURPOSE.See the GNU Affero General Public License for more details.
// You should have received a copy of the GNU Affero General Public License along with this program.
// If not, see < http://www.gnu.org/licenses/>.

import nodemailer from "nodemailer"
import Config from "../config"
import logger from "../utils/logger"

export function sendTextEmail(
  sender: any,
  recipient: any,
  subject: any,
  text: any,
) {
  const transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "apikey",
      pass: Config.sendgridApiKey,
    },
  } as any)

  const mail = transporter.sendMail({
    from: sender,
    to: recipient,
    subject: subject,
    text: text,
  })

  mail.catch(function (err: any) {
    logger.error("polis_err_email_sender_failed_transport_priority_1", err)
    logger.error(`Unable to send email via sendgrid to: ${recipient}`, err)
  })

  return mail
}
