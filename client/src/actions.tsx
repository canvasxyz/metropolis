// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

import $ from "jquery"
import api from "./util/api"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Action = any

/* ======= Types ======= */
export const SUBMIT_NEW_COMMENT = "SUBMIT_NEW_COMMENT"

export const REQUEST_USER = "REQUEST_USER"
export const RECEIVE_USER = "RECEIVE_USER"
export const USER_FETCH_ERROR = "USER_FETCH_ERROR"

export const CREATE_NEW_CONVERSATION = "CREATE_NEW_CONVERSATION"
export const CREATE_NEW_CONVERSATION_SUCCESS = "CREATE_NEW_CONVERSATION_SUCCESS"
export const CREATE_NEW_CONVERSATION_ERROR = "CREATE_NEW_CONVERSATION_ERROR"

export const REQUEST_CONVERSATIONS = "REQUEST_CONVERSATIONS"
export const RECEIVE_CONVERSATIONS = "RECEIVE_CONVERSATIONS"
export const CONVERSATIONS_FETCH_ERROR = "CONVERSATIONS_FETCH_ERROR"

export const REQUEST_CONVERSATION_VOTERS = "REQUEST_CONVERSATION_VOTERS"
export const RECEIVE_CONVERSATION_VOTERS = "RECEIVE_CONVERSATION_VOTERS"
export const VOTERS_FETCH_ERROR = "VOTERS_FETCH_ERROR"

export const CLOSE_CONVERSATION_SUCCESS = "CLOSE_CONVERSATION_SUCCESS"
export const CLOSE_CONVERSATION_ERROR = "CLOSE_CONVERSATION_ERROR"
export const REOPEN_CONVERSATION_SUCCESS = "REOPEN_CONVERSATION_SUCCESS"
export const REOPEN_CONVERSATION_ERROR = "REOPEN_CONVERSATION_ERROR"

export const MODERATE_CONVERSATION_SUCCESS = "MODERATE_CONVERSATION_SUCCESS"
export const MODERATE_CONVERSATION_ERROR = "MODERATE_CONVERSATION_ERROR"
export const UNMODERATE_CONVERSATION_SUCCESS = "UNMODERATE_CONVERSATION_SUCCESS"
export const UNMODERATE_CONVERSATION_ERROR = "UNMODERATE_CONVERSATION_ERROR"

/* zid for clarity - this is conversation config */
export const REQUEST_ZID_METADATA = "REQUEST_ZID_METADATA"
export const RECEIVE_ZID_METADATA = "RECEIVE_ZID_METADATA"
export const ZID_METADATA_FETCH_ERROR = "ZID_METADATA_FETCH_ERROR"
export const ZID_METADATA_RESET = "ZID_METADATA_RESET"

export const UPDATE_ZID_METADATA_STARTED = "UPDATE_ZID_METADATA_STARTED"
export const UPDATE_ZID_METADATA_SUCCESS = "UPDATE_ZID_METADATA_SUCCESS"
export const UPDATE_ZID_METADATA_ERROR = "UPDATE_ZID_METADATA_ERROR"

/* report */
export const UPDATE_REPORT_STARTED = "UPDATE_REPORT_STARTED"
export const UPDATE_REPORT_SUCCESS = "UPDATE_REPORT_SUCCESS"
export const UPDATE_REPORT_ERROR = "UPDATE_REPORT_ERROR"

export const OPTIMISTIC_REPORT_UPDATE = "OPTIMISTIC_REPORT_UPDATE"

/* moderation */
export const REQUEST_COMMENTS = "REQUEST_COMMENTS"
export const RECEIVE_COMMENTS = "RECEIVE_COMMENTS"
export const COMMENTS_FETCH_ERROR = "COMMENTS_FETCH_ERROR"

export const REQUEST_UNMODERATED_COMMENTS = "REQUEST_UNMODERATED_COMMENTS"
export const RECEIVE_UNMODERATED_COMMENTS = "RECEIVE_UNMODERATED_COMMENTS"
export const UNMODERATED_COMMENTS_FETCH_ERROR = "UNMODERATED_COMMENTS_FETCH_ERROR"

export const REQUEST_ACCEPTED_COMMENTS = "REQUEST_ACCEPTED_COMMENTS"
export const RECEIVE_ACCEPTED_COMMENTS = "RECEIVE_ACCEPTED_COMMENTS"
export const ACCEPTED_COMMENTS_FETCH_ERROR = "ACCEPTED_COMMENTS_FETCH_ERROR"

export const REQUEST_REJECTED_COMMENTS = "REQUEST_REJECTED_COMMENTS"
export const RECEIVE_REJECTED_COMMENTS = "RECEIVE_REJECTED_COMMENTS"
export const REJECTED_COMMENTS_FETCH_ERROR = "REJECTED_COMMENTS_FETCH_ERROR"

export const ACCEPT_COMMENT = "ACCEPT_COMMENT"
export const ACCEPT_COMMENT_SUCCESS = "ACCEPT_COMMENT_SUCCESS"
export const ACCEPT_COMMENT_ERROR = "ACCEPT_COMMENT_ERROR"

export const REJECT_COMMENT = "REJECT_COMMENT"
export const REJECT_COMMENT_SUCCESS = "REJECT_COMMENT_SUCCESS"
export const REJECT_COMMENT_ERROR = "REJECT_COMMENT_ERROR"

export const COMMENT_IS_META = "COMMENT_IS_META"
export const COMMENT_IS_META_SUCCESS = "COMMENT_IS_META_SUCCESS"
export const COMMENT_IS_META_ERROR = "COMMENT_IS_META_ERROR"

export const REQUEST_PARTICIPANTS = "REQUEST_PARTICIPANTS"
export const RECEIVE_PARTICIPANTS = "RECEIVE_PARTICIPANTS"
export const PARTICIPANTS_FETCH_ERROR = "PARTICIPANTS_FETCH_ERROR"

export const REQUEST_DEFAULT_PARTICIPANTS = "REQUEST_DEFAULT_PARTICIPANTS"
export const RECEIVE_DEFAULT_PARTICIPANTS = "RECEIVE_DEFAULT_PARTICIPANTS"
export const DEFAULT_PARTICIPANTS_FETCH_ERROR = "DEFAULT_PARTICIPANTS_FETCH_ERROR"

export const REQUEST_FEATURED_PARTICIPANTS = "REQUEST_FEATURED_PARTICIPANTS"
export const RECEIVE_FEATURED_PARTICIPANTS = "RECEIVE_FEATURED_PARTICIPANTS"
export const FEATURED_PARTICIPANTS_FETCH_ERROR = "FEATURED_PARTICIPANTS_FETCH_ERROR"

export const REQUEST_HIDDEN_PARTICIPANTS = "REQUEST_HIDDEN_PARTICIPANTS"
export const RECEIVE_HIDDEN_PARTICIPANTS = "RECEIVE_HIDDEN_PARTICIPANTS"
export const HIDDEN_PARTICIPANTS_FETCH_ERROR = "HIDDEN_PARTICIPANTS_FETCH_ERROR"

/* participant actions */
export const FEATURE_PARTICIPANT = "FEATURE_PARTICIPANT"
export const FEATURE_PARTICIPANT_SUCCESS = "FEATURE_PARTICIPANT_SUCCESS"
export const FEATURE_PARTICIPANT_ERROR = "FEATURE_PARTICIPANT_ERROR"

export const HIDE_PARTICIPANT = "HIDE_PARTICIPANT"
export const HIDE_PARTICIPANT_SUCCESS = "HIDE_PARTICIPANT_SUCCESS"
export const HIDE_PARTICIPANT_ERROR = "HIDE_PARTICIPANT_ERROR"

/* submit seed comment */
export const SEED_COMMENT_LOCAL_UPDATE = "SEED_COMMENT_LOCAL_UPDATE"
export const SUBMIT_SEED_COMMENT = "SUBMIT_SEED_COMMENT"
export const SUBMIT_SEED_COMMENT_SUCCESS = "SUBMIT_SEED_COMMENT_SUCCESS"
export const SUBMIT_SEED_COMMENT_ERROR = "SUBMIT_SEED_COMMENT_ERROR"

/* submit tweet seed comment */
export const SEED_COMMENT_TWEET_LOCAL_UPDATE = "SEED_COMMENT_TWEET_LOCAL_UPDATE"
export const SUBMIT_SEED_COMMENT_TWEET = "SUBMIT_SEED_COMMENT_TWEET"
export const SUBMIT_SEED_COMMENT_TWEET_SUCCESS = "SUBMIT_SEED_COMMENT_TWEET_SUCCESS"
export const SUBMIT_SEED_COMMENT_TWEET_ERROR = "SUBMIT_SEED_COMMENT_TWEET_ERROR"

export const REQUEST_SEED_COMMENTS = "REQUEST_SEED_COMMENTS"
export const RECEIVE_SEED_COMMENTS = "RECEIVE_SEED_COMMENTS"
export const SEED_COMMENTS_FETCH_ERROR = "SEED_COMMENTS_FETCH_ERROR"

/* conversation stats */
export const REQUEST_CONVERSATION_STATS = "REQUEST_CONVERSATION_STATS"
export const RECEIVE_CONVERSATION_STATS = "RECEIVE_CONVERSATION_STATS"
export const CONVERSATION_STATS_FETCH_ERROR = "CONVERSATION_STATS_FETCH_ERROR"

export const DATA_EXPORT_STARTED = "DATA_EXPORT_STARTED"
export const DATA_EXPORT_SUCCESS = "DATA_EXPORT_SUCCESS"
export const DATA_EXPORT_ERROR = "DATA_EXPORT_ERROR"

export const SIGNIN_INITIATED = "SIGNIN_INITIATED"
// export const SIGNIN_SUCCESSFUL = "SIGNIN_SUCCESSFUL";
export const SIGNIN_ERROR = "SIGNIN_ERROR"

export const SIGNOUT_INITIATED = "SIGNOUT_INITIATED"
export const SIGNOUT_SUCCESSFUL = "SIGNOUT_SUCCESSFUL"
export const SIGNOUT_ERROR = "SIGNOUT_ERROR"

export const PWRESET_INIT_INITIATED = "PWRESET_INIT_INITIATED"
export const PWRESET_INIT_SUCCESS = "PWRESET_INIT_SUCCESS"
export const PWRESET_INIT_ERROR = "PWRESET_INIT_ERROR"

export const PWRESET_INITIATED = "PWRESET_INITIATED"
export const PWRESET_SUCCESS = "PWRESET_SUCCESS"
export const PWRESET_ERROR = "PWRESET_ERROR"

export const SUBMIT_CONTRIB = "SUBMIT_CONTRIB"
export const SUBMIT_CONTRIB_SUCCESS = "SUBMIT_CONTRIB_SUCCESS"
export const SUBMIT_CONTRIB_ERROR = "SUBMIT_CONTRIB_ERROR"

/* MATH */

export const REQUEST_MATH = "REQUEST_MATH"
export const RECEIVE_MATH = "RECEIVE_MATH"
export const MATH_FETCH_ERROR = "MATH_FETCH_ERROR"

/* ======= Actions ======= */

/*

  populate is the function the component calls
  fetch is the api call itself
  request tells everyone we"re loading
  receive proxies the data to the store

*/

/* User */

const requestUser = () => {
  return {
    type: REQUEST_USER,
  }
}

const receiveUser = (data) => {
  return {
    type: RECEIVE_USER,
    data: data,
  }
}

const userFetchError = (err) => {
  return {
    type: USER_FETCH_ERROR,
    status: err.status,
    data: err,
  }
}

const fetchUser = () => {
  return api.get("/api/v3/users", { errIfNoAuth: true }, { noCache: true })
}

export const populateUserStore = () => {
  return (dispatch) => {
    dispatch(requestUser())
    return fetchUser().then(
      (res) => dispatch(receiveUser(res)),
      (err) => dispatch(userFetchError(err)),
    )
  }
}

/* passwordResetInit */

const passwordResetInitInitiated = () => {
  return {
    type: PWRESET_INIT_INITIATED,
  }
}

const passwordResetInitSuccess = () => {
  return {
    type: PWRESET_INIT_SUCCESS,
  }
}

const passwordResetInitError = (err) => {
  return {
    type: PWRESET_INIT_ERROR,
    data: err,
  }
}

const passwordResetInitPost = (attrs) => {
  return api.post("/api/v3/auth/pwresettoken", attrs)
}

export const doPasswordResetInit = (attrs) => {
  return (dispatch) => {
    dispatch(passwordResetInitInitiated())
    return passwordResetInitPost(attrs).then(
      () => {
        setTimeout(() => {
          // Force page to load so we can be sure the password is cleared from memory
          // delay a bit so the cookie has time to set
          window.location.assign("/pwresetinit/done")
        }, 3000)

        return dispatch(passwordResetInitSuccess())
      },
      (err) => dispatch(passwordResetInitError(err)),
    )
  }
}

/* passwordReset */

const passwordResetInitiated = () => {
  return {
    type: PWRESET_INITIATED,
  }
}

const passwordResetSuccess = () => {
  return {
    type: PWRESET_SUCCESS,
  }
}

const passwordResetError = (err) => {
  return {
    type: PWRESET_ERROR,
    data: err,
  }
}

const passwordResetPost = (attrs) => {
  return api.post("/api/v3/auth/password", attrs)
}

export const doPasswordReset = (attrs) => {
  return (dispatch) => {
    dispatch(passwordResetInitiated())
    return passwordResetPost(attrs).then(
      () => {
        setTimeout(() => {
          // Force page to load so we can be sure the password is cleared from memory
          // delay a bit so the cookie has time to set
          window.location.assign("/")
        }, 3000)

        return dispatch(passwordResetSuccess())
      },
      (err) => dispatch(passwordResetError(err)),
    )
  }
}

/* signout */

const signoutInitiated = () => {
  return {
    type: SIGNOUT_INITIATED,
  }
}

// SIGNOUT_SUCCESSFUL Not needed since redirecting to clear old user"s state from memory

const signoutError = (err) => {
  return {
    type: SIGNOUT_ERROR,
    data: err,
  }
}

const signoutPost = () => {
  // relying on server to clear cookies
  return $.ajax({
    type: "POST",
    url: "/api/v3/auth/deregister",
    data: {},
    dataType: "text", // server returns an empty response, so can"t parse as JSON
  })
}

export const doSignout = (dest) => {
  return (dispatch) => {
    dispatch(signoutInitiated())
    return signoutPost().then(
      () => {
        setTimeout(() => {
          // Force page to load so we can be sure the old user"s state is cleared from memory
          // delay a bit so the cookies have time to clear too.
          window.location = dest || "/"
        }, 1000)
      },
      (err) => dispatch(signoutError(err)),
    )
  }
}

/* Conversations */

const requestConversations = () => {
  return {
    type: REQUEST_CONVERSATIONS,
  }
}

const receiveConversations = (data) => {
  return {
    type: RECEIVE_CONVERSATIONS,
    data: data,
  }
}

const conversationsError = (err) => {
  return {
    type: CONVERSATIONS_FETCH_ERROR,
    data: err,
  }
}

const fetchConversations = () => {
  return $.get("/api/v3/conversations?include_all_conversations_i_am_in=true")
}

export const populateConversationsStore = () => {
  return (dispatch) => {
    dispatch(requestConversations())
    return fetchConversations().then(
      (res) => dispatch(receiveConversations(res)),
      (err) => dispatch(conversationsError(err)),
    )
  }
}

/* zid metadata */

const requestZidMetadata = (conversation_id) => {
  return {
    type: REQUEST_ZID_METADATA,
    data: {
      conversation_id: conversation_id,
    },
  }
}

const receiveZidMetadata = (data) => {
  return {
    type: RECEIVE_ZID_METADATA,
    data: data,
  }
}

const zidMetadataFetchError = (err) => {
  return {
    type: ZID_METADATA_FETCH_ERROR,
    data: err,
  }
}

export const resetMetadataStore = () => {
  return {
    type: ZID_METADATA_RESET,
  }
}

const fetchZidMetadata = (conversation_id) => {
  return $.get("/api/v3/conversation/" + conversation_id)
}

export const populateZidMetadataStore = (conversation_id, reload?: boolean) => {
  return (dispatch, getState) => {
    const state = getState()
    const hasConversationId =
      state.zid_metadata &&
      state.zid_metadata.zid_metadata &&
      state.zid_metadata.zid_metadata.conversation_id

    const isLoading = state.zid_metadata.loading
    // NOTE: if there are multiple calls outstanding this may be wrong.
    const isLoadingThisConversation =
      state.zid_metadata.conversation_id === conversation_id && isLoading

    if (isLoadingThisConversation) {
      return
    }

    // don"t fetch again if we already have data loaded for that conversation.
    if (
      hasConversationId &&
      state.zid_metadata.zid_metadata.conversation_id === conversation_id &&
      !reload
    ) {
      return
    }

    dispatch(requestZidMetadata(conversation_id))
    return fetchZidMetadata(conversation_id).then(
      (res) => dispatch(receiveZidMetadata(res)),
      (err) => dispatch(zidMetadataFetchError(err)),
    )
  }
}

/* zid metadata update */

const updateZidMetadataStarted = () => {
  return {
    type: UPDATE_ZID_METADATA_STARTED,
  }
}

const updateZidMetadataSuccess = (data) => {
  return {
    type: UPDATE_ZID_METADATA_SUCCESS,
    data: data,
  }
}

const updateZidMetadataError = (err) => {
  return {
    type: UPDATE_ZID_METADATA_ERROR,
    data: err,
  }
}

const updateZidMetadata = (zm) => {
  return $.ajax({
    url: "/api/v3/conversations",
    method: "PUT",
    contentType: "application/json; charset=utf-8",
    headers: { "Cache-Control": "max-age=0" },
    xhrFields: { withCredentials: true },
    dataType: "json",
    data: JSON.stringify(zm),
  })
}

export const handleZidMetadataUpdate = (newZidMetadata) => {
  return (dispatch) => {
    dispatch(updateZidMetadataStarted())
    return updateZidMetadata(newZidMetadata)
      .then((res) => dispatch(updateZidMetadataSuccess(res)))
      .fail((err) => dispatch(updateZidMetadataError(err)))
  }
}

export const handleSubmitNewComment = (conversation_id: string) => {
  return {
    type: SUBMIT_NEW_COMMENT,
    conversation_id,
  }
}

/* create conversation */

const createConversationStart = () => {
  return {
    type: CREATE_NEW_CONVERSATION,
  }
}

const createConversationPostSuccess = (res) => {
  return {
    type: CREATE_NEW_CONVERSATION_SUCCESS,
    data: res,
  }
}

const createConversationPostError = (err) => {
  return {
    type: CREATE_NEW_CONVERSATION_ERROR,
    data: err,
  }
}

const postCreateConversation = (topic, description) => {
  return api.post("/api/v3/conversations", {
    topic,
    description,
    auth_needed_to_vote: true,
    auth_needed_to_write: true,
  })
}

export const handleCreateConversationSubmit = (topic, description, fromDashboard?) => {
  return (dispatch) => {
    dispatch(createConversationStart())
    return postCreateConversation(topic, description)
      .then(
        (res) => {
          dispatch(createConversationPostSuccess(res))
          return res
        },
        (err) => dispatch(createConversationPostError(err)),
      )
      .then((res) => {
        window.location.assign((fromDashboard ? "/dashboard/c/" : "/m/") + res.conversation_id)
      })
  }
}

const postCloseConversation = (conversation_id) => {
  return api.post("/api/v3/conversation/close", {
    conversation_id,
  })
}

export const handleCloseConversation = (conversation_id) => {
  return (dispatch) => {
    return postCloseConversation(conversation_id).then(
      (res) => {
        dispatch({ type: CLOSE_CONVERSATION_SUCCESS, data: conversation_id })
        dispatch(populateZidMetadataStore(conversation_id, true))
        return res
      },
      (err) => dispatch({ type: CLOSE_CONVERSATION_ERROR, data: err }),
    )
  }
}

const postReopenConversation = (conversation_id) => {
  return api.post("/api/v3/conversation/reopen", {
    conversation_id,
  })
}

export const handleReopenConversation = (conversation_id) => {
  return (dispatch) => {
    return postReopenConversation(conversation_id).then(
      (res) => {
        dispatch({ type: REOPEN_CONVERSATION_SUCCESS, data: conversation_id })
        dispatch(populateZidMetadataStore(conversation_id, true))
        return res
      },
      (err) => dispatch({ type: REOPEN_CONVERSATION_ERROR, data: err }),
    )
  }
}

const postModerateConversation = (conversation_id) => {
  return api.post("/api/v3/conversation/moderate", {
    conversation_id,
  })
}

export const handleModerateConversation = (conversation_id) => {
  return (dispatch) => {
    return postModerateConversation(conversation_id).then(
      (res) => {
        dispatch({ type: MODERATE_CONVERSATION_SUCCESS, data: conversation_id })
        dispatch(populateZidMetadataStore(conversation_id, true))
        return res
      },
      (err) => dispatch({ type: MODERATE_CONVERSATION_ERROR, data: err }),
    )
  }
}

const postUnmoderateConversation = (conversation_id) => {
  return api.post("/api/v3/conversation/unmoderate", {
    conversation_id,
  })
}

export const handleUnmoderateConversation = (conversation_id) => {
  return (dispatch) => {
    return postUnmoderateConversation(conversation_id).then(
      (res) => {
        dispatch({ type: UNMODERATE_CONVERSATION_SUCCESS, data: conversation_id })
        dispatch(populateZidMetadataStore(conversation_id, true))
        return res
      },
      (err) => dispatch({ type: UNMODERATE_CONVERSATION_ERROR, data: err }),
    )
  }
}

/* request all comments */

const requestComments = () => {
  return {
    type: REQUEST_COMMENTS,
  }
}

const receiveComments = (data) => {
  return {
    type: RECEIVE_COMMENTS,
    data: data,
  }
}

const commentsFetchError = (err) => {
  return {
    type: COMMENTS_FETCH_ERROR,
    data: err,
  }
}

const fetchAllComments = (conversation_id) => {
  // let includeSocial = "include_social=true&";
  const includeSocial = ""
  return $.get(
    "/api/v3/comments?moderation=true&include_voting_patterns=false&" +
      includeSocial +
      "conversation_id=" +
      conversation_id,
  )
}

export const populateCommentsStore = (conversation_id) => {
  return (dispatch) => {
    dispatch(requestComments())
    return fetchAllComments(conversation_id).then(
      (res) => dispatch(receiveComments(res)),
      (err) => dispatch(commentsFetchError(err)),
    )
  }
}

/* request math */

const requestMath = () => {
  return {
    type: REQUEST_MATH,
  }
}

const receiveMath = (data) => {
  return {
    type: RECEIVE_MATH,
    data: data,
  }
}

const mathFetchError = (err) => {
  return {
    type: MATH_FETCH_ERROR,
    data: err,
  }
}

const fetchMath = (conversation_id, math_tick) => {
  return $.get("/api/v3/math/pca2?&math_tick=" + math_tick + "&conversation_id=" + conversation_id)
}

export const populateMathStore = (conversation_id) => {
  return (dispatch, getState) => {
    dispatch(requestMath())
    const math_tick = getState().math.math_tick
    return fetchMath(conversation_id, math_tick).then(
      (res) => dispatch(receiveMath(res)),
      (err) => dispatch(mathFetchError(err)),
    )
  }
}

/* unmoderated comments */

const requestUnmoderatedComments = () => {
  return {
    type: REQUEST_UNMODERATED_COMMENTS,
  }
}

const receiveUnmoderatedComments = (data) => {
  return {
    type: RECEIVE_UNMODERATED_COMMENTS,
    data: data,
  }
}

const unmoderatedCommentsFetchError = (err) => {
  return {
    type: UNMODERATED_COMMENTS_FETCH_ERROR,
    data: err,
  }
}

const fetchUnmoderatedComments = (conversation_id) => {
  // let includeSocial = "include_social=true&";
  const includeSocial = ""
  return $.get(
    "/api/v3/comments?moderation=true&include_voting_patterns=false&" +
      includeSocial +
      "mod=0&conversation_id=" +
      conversation_id,
  )
}

export const populateUnmoderatedCommentsStore = (conversation_id) => {
  return (dispatch) => {
    dispatch(requestUnmoderatedComments())
    return fetchUnmoderatedComments(conversation_id).then(
      (res) => dispatch(receiveUnmoderatedComments(res)),
      (err) => dispatch(unmoderatedCommentsFetchError(err)),
    )
  }
}

/* accepted comments */

const requestAcceptedComments = () => {
  return {
    type: REQUEST_ACCEPTED_COMMENTS,
  }
}

const receiveAcceptedComments = (data) => {
  return {
    type: RECEIVE_ACCEPTED_COMMENTS,
    data: data,
  }
}

const acceptedCommentsFetchError = (err) => {
  return {
    type: ACCEPTED_COMMENTS_FETCH_ERROR,
    data: err,
  }
}

const fetchAcceptedComments = (conversation_id) => {
  // let includeSocial = "include_social=true&";
  const includeSocial = ""
  return $.get(
    "/api/v3/comments?moderation=true&include_voting_patterns=false&mod=1&" +
      includeSocial +
      "conversation_id=" +
      conversation_id,
  )
}

export const populateAcceptedCommentsStore = (conversation_id) => {
  return (dispatch) => {
    dispatch(requestAcceptedComments())
    return fetchAcceptedComments(conversation_id).then(
      (res) => dispatch(receiveAcceptedComments(res)),
      (err) => dispatch(acceptedCommentsFetchError(err)),
    )
  }
}

/* rejected comments */

const requestRejectedComments = () => {
  return {
    type: REQUEST_REJECTED_COMMENTS,
  }
}

const receiveRejectedComments = (data) => {
  return {
    type: RECEIVE_REJECTED_COMMENTS,
    data: data,
  }
}

const rejectedCommentsFetchError = (err) => {
  return {
    type: REJECTED_COMMENTS_FETCH_ERROR,
    data: err,
  }
}

const fetchRejectedComments = (conversation_id) => {
  // let includeSocial = "include_social=true&";
  const includeSocial = ""
  return $.get(
    "/api/v3/comments?moderation=true&include_voting_patterns=false&" +
      includeSocial +
      "mod=-1&conversation_id=" +
      conversation_id,
  )
}

export const populateRejectedCommentsStore = (conversation_id) => {
  return (dispatch) => {
    dispatch(requestRejectedComments())
    return fetchRejectedComments(conversation_id).then(
      (res) => dispatch(receiveRejectedComments(res)),
      (err) => dispatch(rejectedCommentsFetchError(err)),
    )
  }
}

/* populate ALL stores todo/accept/reject/seed */

export const populateAllCommentStores = (conversation_id) => {
  return (dispatch) => {
    return $.when(
      dispatch(populateUnmoderatedCommentsStore(conversation_id)),
      dispatch(populateAcceptedCommentsStore(conversation_id)),
      dispatch(populateRejectedCommentsStore(conversation_id)),
    )
  }
}

/* participant stores */

const fetchConversationVoters = (conversation_id) => {
  return $.get("/api/v3/participants?conversation_id=" + conversation_id)
}

const votersFetchError = (err) => {
  return {
    type: VOTERS_FETCH_ERROR,
    data: err,
  }
}

const requestConversationVoters = () => {
  return {
    type: REQUEST_CONVERSATION_VOTERS,
  }
}

const receiveConversationVoters = (data) => {
  return {
    type: RECEIVE_CONVERSATION_VOTERS,
    data: data,
  }
}

export const populateVoterStores = (conversation_id) => {
  return (dispatch) => {
    dispatch(requestConversationVoters())
    return fetchConversationVoters(conversation_id).then(
      (res) => dispatch(receiveConversationVoters({ conversation_id, conversation_voters: res })),
      (err) => dispatch(votersFetchError(err)),
    )
  }
}

/* moderator clicked accept comment */

const optimisticCommentAccepted = (comment) => {
  return {
    type: ACCEPT_COMMENT,
    comment: comment,
  }
}

const acceptCommentSuccess = (data) => {
  return {
    type: ACCEPT_COMMENT_SUCCESS,
    data: data,
  }
}

const acceptCommentError = (err) => {
  return {
    type: ACCEPT_COMMENT_ERROR,
    data: err,
  }
}

const putCommentAccepted = (comment) => {
  return $.ajax({
    method: "PUT",
    url: "/api/v3/comments",
    data: Object.assign(comment, { mod: 1 }),
  })
}

export const changeCommentStatusToAccepted = (comment) => {
  comment.active = true
  return (dispatch) => {
    dispatch(optimisticCommentAccepted(comment))
    return putCommentAccepted(comment).then(
      (res) => {
        dispatch(acceptCommentSuccess(res))
        dispatch(populateAllCommentStores(comment.conversation_id))
      },
      (err) => dispatch(acceptCommentError(err)),
    )
  }
}

/* moderator clicked reject comment */

const optimisticCommentRejected = (comment) => {
  return {
    type: REJECT_COMMENT,
    comment: comment,
  }
}

const rejectCommentSuccess = (data) => {
  return {
    type: REJECT_COMMENT_SUCCESS,
    data: data,
  }
}

const rejectCommentError = (err) => {
  return {
    type: REJECT_COMMENT_ERROR,
    data: err,
  }
}

const putCommentRejected = (comment) => {
  return $.ajax({
    method: "PUT",
    url: "/api/v3/comments",
    data: Object.assign(comment, { mod: -1 }),
  })
}

export const changeCommentStatusToRejected = (comment) => {
  return (dispatch) => {
    dispatch(optimisticCommentRejected(comment))
    return putCommentRejected(comment).then(
      (res) => {
        dispatch(rejectCommentSuccess(res))
        dispatch(populateAllCommentStores(comment.conversation_id))
      },
      (err) => dispatch(rejectCommentError(err)),
    )
  }
}

/* moderator changed comment's is_meta flag */

const optimisticCommentIsMetaChanged = (comment) => {
  return {
    type: COMMENT_IS_META,
    comment: comment,
  }
}

const commentIsMetaChangeSuccess = (data) => {
  return {
    type: COMMENT_IS_META_SUCCESS,
    data: data,
  }
}

const commentIsMetaChangeError = (err) => {
  return {
    type: COMMENT_IS_META_ERROR,
    data: err,
  }
}

const putCommentCommentIsMetaChange = (comment, is_meta) => {
  return $.ajax({
    method: "PUT",
    url: "/api/v3/comments",
    data: Object.assign(comment, { is_meta: is_meta }),
  })
}

export const changeCommentCommentIsMeta = (comment, is_meta) => {
  return (dispatch) => {
    dispatch(optimisticCommentIsMetaChanged(comment))
    return putCommentCommentIsMetaChange(comment, is_meta).then(
      (res) => {
        dispatch(commentIsMetaChangeSuccess(res))
        dispatch(populateAllCommentStores(comment.conversation_id))
      },
      (err) => dispatch(commentIsMetaChangeError(err)),
    )
  }
}

/* request participants */

const requestParticipants = () => {
  return {
    type: REQUEST_PARTICIPANTS,
  }
}

const receiveParticipants = (data) => {
  return {
    type: RECEIVE_PARTICIPANTS,
    data: data,
  }
}

const participantsFetchError = (err) => {
  return {
    type: PARTICIPANTS_FETCH_ERROR,
    data: err,
  }
}

const fetchParticipants = (conversation_id) => {
  return $.get("/api/v3/ptptois?conversation_id=" + conversation_id)
}

export const populateParticipantsStore = (conversation_id) => {
  return (dispatch) => {
    dispatch(requestParticipants())
    return fetchParticipants(conversation_id).then(
      (res) => dispatch(receiveParticipants(res)),
      (err) => dispatch(participantsFetchError(err)),
    )
  }
}

/* request default participants for ptpt moderation view */

const requestDefaultParticipants = () => {
  return {
    type: REQUEST_DEFAULT_PARTICIPANTS,
  }
}

const receiveDefaultParticipants = (data) => {
  return {
    type: RECEIVE_DEFAULT_PARTICIPANTS,
    data: data,
  }
}

const defaultParticipantFetchError = (err) => {
  return {
    type: DEFAULT_PARTICIPANTS_FETCH_ERROR,
    data: err,
  }
}

const fetchDefaultParticipants = (conversation_id) => {
  return $.get("/api/v3/ptptois?mod=0&conversation_id=" + conversation_id)
}

export const populateDefaultParticipantStore = (conversation_id) => {
  return (dispatch) => {
    dispatch(requestDefaultParticipants())
    return fetchDefaultParticipants(conversation_id).then(
      (res) => dispatch(receiveDefaultParticipants(res)),
      (err) => dispatch(defaultParticipantFetchError(err)),
    )
  }
}

/* request featured participants for ptpt moderation view */

const requestFeaturedParticipants = () => {
  return {
    type: REQUEST_FEATURED_PARTICIPANTS,
  }
}

const receiveFeaturedParticipants = (data) => {
  return {
    type: RECEIVE_FEATURED_PARTICIPANTS,
    data: data,
  }
}

const featuredParticipantFetchError = (err) => {
  return {
    type: FEATURED_PARTICIPANTS_FETCH_ERROR,
    data: err,
  }
}

const fetchFeaturedParticipants = (conversation_id) => {
  return $.get("/api/v3/ptptois?mod=1&conversation_id=" + conversation_id)
}

export const populateFeaturedParticipantStore = (conversation_id) => {
  return (dispatch) => {
    dispatch(requestFeaturedParticipants())
    return fetchFeaturedParticipants(conversation_id).then(
      (res) => dispatch(receiveFeaturedParticipants(res)),
      (err) => dispatch(featuredParticipantFetchError(err)),
    )
  }
}

/* request hidden participants for ptpt moderation view */

const requestHiddenParticipants = () => {
  return {
    type: REQUEST_HIDDEN_PARTICIPANTS,
  }
}

const receiveHiddenParticipants = (data) => {
  return {
    type: RECEIVE_HIDDEN_PARTICIPANTS,
    data: data,
  }
}

const hiddenParticipantFetchError = (err) => {
  return {
    type: HIDDEN_PARTICIPANTS_FETCH_ERROR,
    data: err,
  }
}

const fetchHiddenParticipants = (conversation_id) => {
  return $.get("/api/v3/ptptois?mod=-1&conversation_id=" + conversation_id)
}

export const populateHiddenParticipantStore = (conversation_id) => {
  return (dispatch) => {
    dispatch(requestHiddenParticipants())
    return fetchHiddenParticipants(conversation_id).then(
      (res) => dispatch(receiveHiddenParticipants(res)),
      (err) => dispatch(hiddenParticipantFetchError(err)),
    )
  }
}

/* populate ALL stores todo/accept/reject/seed */

export const populateAllParticipantStores = (conversation_id) => {
  return (dispatch) => {
    return $.when(
      dispatch(populateDefaultParticipantStore(conversation_id)),
      dispatch(populateFeaturedParticipantStore(conversation_id)),
      dispatch(populateHiddenParticipantStore(conversation_id)),
    )
  }
}

/* moderator clicked feature ptpt */

const optimisticFeatureParticipant = (participant) => {
  return {
    type: FEATURE_PARTICIPANT,
    participant: participant,
  }
}

const featureParticipantSuccess = (data) => {
  return {
    type: FEATURE_PARTICIPANT_SUCCESS,
    data: data,
  }
}

const featureParticipantError = (err) => {
  return {
    type: FEATURE_PARTICIPANT_ERROR,
    data: err,
  }
}

const putFeatureParticipant = (participant) => {
  return $.ajax({
    method: "PUT",
    url: "/api/v3/ptptois",
    data: Object.assign(participant, { mod: 1 }),
  })
}

export const changeParticipantStatusToFeatured = (participant) => {
  return (dispatch) => {
    dispatch(optimisticFeatureParticipant(participant))
    return putFeatureParticipant(participant).then(
      (res) => dispatch(featureParticipantSuccess(res)),
      (err) => dispatch(featureParticipantError(err)),
    )
  }
}
/* moderator clicked hide ptpt */

const optimisticHideParticipant = (participant) => {
  return {
    type: FEATURE_PARTICIPANT,
    participant: participant,
  }
}

const hideParticipantSuccess = (data) => {
  return {
    type: FEATURE_PARTICIPANT_SUCCESS,
    data: data,
  }
}

const hideParticipantError = (err) => {
  return {
    type: FEATURE_PARTICIPANT_ERROR,
    data: err,
  }
}

const putHideParticipant = (participant) => {
  return $.ajax({
    method: "PUT",
    url: "/api/v3/ptptois",
    data: Object.assign(participant, { mod: -1 }),
  })
}

export const changeParticipantStatusToHidden = (participant) => {
  return (dispatch) => {
    dispatch(optimisticHideParticipant(participant))
    return putHideParticipant(participant).then(
      (res) => dispatch(hideParticipantSuccess(res)),
      (err) => dispatch(hideParticipantError(err)),
    )
  }
}

/* moderator clicked unmoderate ptpt */
const optimisticUnmoderateParticipant = (participant) => {
  return {
    type: FEATURE_PARTICIPANT,
    participant: participant,
  }
}

const putUnmoderateParticipant = (participant) => {
  return $.ajax({
    method: "PUT",
    url: "/api/v3/ptptois",
    data: Object.assign(participant, { mod: 0 }),
  })
}

export const changeParticipantStatusToUnmoderated = (participant) => {
  return (dispatch) => {
    dispatch(optimisticUnmoderateParticipant(participant))
    return putUnmoderateParticipant(participant).then(
      (res) => dispatch(hideParticipantSuccess(res)),
      (err) => dispatch(hideParticipantError(err)),
    )
  }
}

/* request conversation stats */

const requestConversationStats = () => {
  return {
    type: REQUEST_CONVERSATION_STATS,
  }
}

const receiveConversationStats = (data, conversation_id) => {
  return {
    type: RECEIVE_CONVERSATION_STATS,
    data: data,
    conversation_id,
  }
}

const conversationStatsFetchError = (err) => {
  return {
    type: CONVERSATION_STATS_FETCH_ERROR,
    data: err,
  }
}

const fetchConversationStats = (conversation_id, until) => {
  return $.get(
    "/api/v3/conversationStats?conversation_id=" +
      conversation_id +
      (until ? "&until=" + until : ""),
  )
}

export const populateConversationStatsStore = (conversation_id, until) => {
  return (dispatch) => {
    dispatch(requestConversationStats())
    return fetchConversationStats(conversation_id, until).then(
      (res) => dispatch(receiveConversationStats(res, conversation_id)),
      (err) => dispatch(conversationStatsFetchError(err)),
    )
  }
}

// const dataExportGet = (conversation_id, format, unixTimestamp, untilEnabled) => {
//   const url = `/api/v3/dataExport?conversation_id=${conversation_id}&format=${format}`
//   return $.get(url)
// }

// // poll for new comments, since others might be creating comments?
// function getNextComment(conversationId, currentCommentTid) {
//   return api.get("api/v3/nextComment", {
//     not_voted_by_pid: "mypid",
//     limit: 1,
//     include_social: true,
//     conversation_id: conversationId,
//     without: currentCommentTid ? [currentCommentTid] : []
//   });
// }
