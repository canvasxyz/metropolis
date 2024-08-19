// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

import * as types from "../actions"

const conversation_voters = (
  state = {
    loading: false,
    voters: {},
  },
  action,
) => {
  switch (action.type) {
    case types.REQUEST_CONVERSATION_VOTERS:
      return Object.assign({}, state, {
        loading: true,
      })
    case types.RECEIVE_CONVERSATION_VOTERS:
      return Object.assign({}, state, {
        loading: false,
        voters: {
          ...state.voters,
          [action.data.conversation_id]: action.data.conversation_voters,
        },
      })
    default:
      return state
  }
}

export default conversation_voters
