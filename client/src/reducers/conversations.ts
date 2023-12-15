// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

import * as types from "../actions"

const conversations = (
  state = {
    loading: false,
    error: null,
    conversations: null,
  },
  action,
) => {
  switch (action.type) {
    case types.REQUEST_CONVERSATIONS:
      return Object.assign({}, state, {
        loading: true,
        error: null,
      })
    case types.RECEIVE_CONVERSATIONS:
      return Object.assign({}, state, {
        loading: false,
        error: null,
        conversations: action.data,
      })
    case types.CONVERSATIONS_FETCH_ERROR:
      return Object.assign({}, state, {
        loading: false,
        error: action.data,
        conversations: null,
      })
    case types.CLOSE_CONVERSATION_SUCCESS:
      return Object.assign({}, state, {
        conversations: state.conversations?.map((c) =>
          c.conversation_id === action.data ? { ...c, is_archived: true } : c,
        ),
      })
    case types.REOPEN_CONVERSATION_SUCCESS:
      return Object.assign({}, state, {
        conversations: state.conversations?.map((c) =>
          c.conversation_id === action.data ? { ...c, is_archived: false } : c,
        ),
      })
    case types.MODERATE_CONVERSATION_SUCCESS:
      return Object.assign({}, state, {
        conversations: state.conversations?.map((c) =>
          c.conversation_id === action.data ? { ...c, is_hidden: true } : c,
        ),
      })
    case types.UNMODERATE_CONVERSATION_SUCCESS:
      return Object.assign({}, state, {
        conversations: state.conversations?.map((c) =>
          c.conversation_id === action.data ? { ...c, is_hidden: false } : c,
        ),
      })
    default:
      return state
  }
}

export default conversations
