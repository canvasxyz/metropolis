// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

import _ from "lodash"
import toast from "react-hot-toast"
import * as types from "../actions"

const zid = (
  state = {
    loading: false,
    zid_metadata: {},
    error: null,
    optimistic: 0 /* `h4x0rz` trigger render because shallow comparison https://github.com/reactjs/redux/issues/585 */,
  },
  action
) => {
  switch (action.type) {
    case types.REQUEST_ZID_METADATA:
      return Object.assign({}, state, {
        conversation_id: action.data.conversation_id,
        loading: true,
        error: null,
      })
    case types.RECEIVE_ZID_METADATA:
      return Object.assign({}, state, {
        loading: false,
        zid_metadata: action.data,
        error: null,
      })
    case types.ZID_METADATA_RESET:
      return Object.assign({}, state, {
        loading: false,
        zid_metadata: {},
        error: null,
      })
    case types.UPDATE_ZID_METADATA_STARTED:
      return Object.assign({}, state, {
        loading: true,
        error: null,
      })
    case types.UPDATE_ZID_METADATA_SUCCESS:
      const filtered_zid_metadata: any = { ...state.zid_metadata }
      delete filtered_zid_metadata.site_id
      delete filtered_zid_metadata.auth_opt_fb
      delete filtered_zid_metadata.auth_opt_fb_computed
      delete filtered_zid_metadata.auth_opt_tw_computed
      delete filtered_zid_metadata.translations
      delete filtered_zid_metadata.ownername
      delete filtered_zid_metadata.is_owner
      delete filtered_zid_metadata.modified
      const filtered_action_data: any = { ...action.data }
      delete filtered_action_data.auth_opt_fb
      delete filtered_action_data.modified

      if (JSON.stringify(filtered_zid_metadata) !== JSON.stringify(filtered_action_data)) {
        toast.success("Changes saved")
      }
      return Object.assign({}, state, {
        loading: false,
        zid_metadata: action.data,
        error: null,
      })
    case types.UPDATE_ZID_METADATA_ERROR:
      return Object.assign({}, state, {
        loading: false,
        error: action.data,
      })
    default:
      return state
  }
}

export default zid
