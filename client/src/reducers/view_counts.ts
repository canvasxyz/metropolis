// Copyright (C) 2024-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { useAppSelector } from "../hooks"

/* conversation view counts */
const incrementViewCountRequest = createAsyncThunk(
  "view_counts/increment_view_count",
  async (conversation_id: string) => {
    const response = (await fetch(
      `/api/v3/increment_conversation_view_count?conversation_id=${conversation_id}`,
      {
        method: "POST",
      },
    )) as any
    return { conversation_id, view_count: await response.json() }
  },
)

type ViewCountsState = {
  seen_conversation_ids: Record<string, boolean>
  view_counts: Record<string, number>
}

const viewCountsSlice = createSlice({
  name: "view_counts",
  initialState: {
    seen_conversation_ids: {},
    view_counts: {},
  } as ViewCountsState,
  reducers: {
    setSeenConversationId: (state, action) => {
      state.seen_conversation_ids[action.payload] = true
    },
  },
  extraReducers: (builder) => {
    builder.addCase(incrementViewCountRequest.fulfilled, (state, action) => {
      state.view_counts[action.payload.conversation_id] = action.payload.view_count
    })
  },
})

export const incrementViewCount = (conversation_id) => (dispatch, getState) => {
  const state = getState()
  if (state.view_counts.seen_conversation_ids[conversation_id]) {
    return
  }
  dispatch(viewCountsSlice.actions.setSeenConversationId(conversation_id))
  dispatch(incrementViewCountRequest(conversation_id))
}

export const useViewCount = (conversation_id: string) => {
  return useAppSelector((state) => state.view_counts.view_counts[conversation_id] || 0)
}

export default viewCountsSlice.reducer
