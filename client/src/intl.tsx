// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

const s = {
  polis_err_param_parse_failed_email: "Please enter a valid email address.",
  polis_err_reg_bad_email: "Please enter a valid email address.",
  polis_err_param_parse_failed_password: "Please enter a valid password.",
  polis_err_login_unknown_user_or_password_noresults:
    "Login failed: invalid username/password combination.",
  polis_err_login_unknown_user_or_password: "Login failed: invalid username/password combination.",
  polis_err_reg_user_with_that_email_exists:
    "Email address already in use. Try logging in instead.",
  polis_err_reg_need_name: "Please include your name.",
  polis_err_post_comment_duplicate: "Error posting: This comment already exists!",
  polis_err_fetching_tweet: "Error fetching tweet. Expected a URL to a twitter tweet.",
  share_but_no_comments_warning:
    "This conversation has no comments. We recommend you add a few comments before inviting participants. This will help participants get started. Go to 'Configure' and then 'Seed Comments'.",
  share_but_no_visible_comments_warning:
    "This conversation has no visible comments. We recommend you add a few comments (or moderate the comments that exist) before inviting participants, since this will help them understand what kind of comments they should submit.",
  no_permission: "Your account does not have the permissions to view this page.",
}

function f(key) {
  // strip whitespace from key
  key = key.replace(/\s+$/, "").replace(/^\s+/, "")
  if (typeof s[key] === "undefined") {
    return key
  }
  return s[key]
}

export default f
