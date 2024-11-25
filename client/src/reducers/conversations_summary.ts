import * as types from "../actions"
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { FipVersion } from "../util/types"

const populateConversationsSummary = createAsyncThunk(
  "conversations_summary/populateConversationsSummary",
  async () => {
    const response = await fetch("/api/v3/conversations_summary")
    return await response.json()
  },
)

export type ConversationSummary = {
  fip_version: FipVersion | null
  participant_count: number
  comment_count: number | null
  sentiment_count: number | null
  view_count: number | null
  topic: string | null
  is_archived: boolean
  is_hidden: boolean
  is_owner: boolean
  owner: number
  conversation_id: string
  created: number
  description: string | null
  help_type: number
  postsurvey: string | null
  postsurvey_limit: string | null
  postsurvey_redirect: string | null
  auth_needed_to_write: boolean
}

type ConversationSummaryState =
  | {
      status: "idle"
      data: null
      error: null
    }
  | {
      status: "loading"
      data: null | ConversationSummary[]
      error: null
    }
  | {
      status: "succeeded"
      data: ConversationSummary[]
      error: null
    }
  | {
      status: "failed"
      data: null
      error: string
    }

const conversationsSummarySlice = createSlice({
  name: "conversations_summary",
  initialState: {
    status: "idle",
    data: null,
    error: null,
  } as ConversationSummaryState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(populateConversationsSummary.pending, (state) => {
        state.status = "loading"
      })
      .addCase(populateConversationsSummary.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.data = action.payload
      })
      .addCase(populateConversationsSummary.rejected, (state, action) => {
        state.status = "failed"
        state.data = null
        state.error = action.error.message
      })
      .addDefaultCase((state, action) => {
        if (action.type === types.SUBMIT_NEW_COMMENT) {
          const conversation = state.data.find(
            (d) => d.conversation_id === (action as any).conversation_id,
          )
          conversation.comment_count = conversation.comment_count + 1
        }
        return state
      })
  },
})

export default conversationsSummarySlice.reducer
export { populateConversationsSummary }
