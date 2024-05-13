import * as types from "../actions"
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

const populateConversationsSummary = createAsyncThunk(
  "conversations_summary/populateConversationsSummary",
  async () => {
    const response = await fetch("/api/v3/conversations_summary")
    return await response.json()
  },
)

export type ConversationSummary = {
  fip_created: string | null
  fip_title: string | null
  fip_number: number
  fip_status: string
  github_pr_opened_at: string | null
  github_pr_updated_at: string | null
  github_pr_closed_at: string | null
  github_pr_merged_at: string | null
  github_pr_is_draft: boolean
  github_pr_title: string | null
  github_pr_id: string | null
  fip_files_created: string | null
  participant_count: number
  comment_count: number | null
  sentiment_count: number | null
  topic: string | null
  is_archived: boolean
  is_hidden: boolean
  is_owner: boolean
  owner: number
  conversation_id: string
  created: number
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
