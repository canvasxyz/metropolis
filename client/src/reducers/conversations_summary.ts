import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const populateConversationsSummary = createAsyncThunk('conversations_summary/populateConversationsSummary', async () => {
  const response = await fetch('/api/v3/conversations_summary');
  return await response.json();
});

export type ConversationSummary = {
  fip_created: string | null
  fip_title: string | null
  fip_number: number
  github_pr_opened_at: string | null
  github_pr_title: string | null
  github_pr_id: string | null
  topic: string | null
  is_archived: boolean
  is_hidden: boolean
  conversation_id: string
  created: number
}

type ConversationSummaryState = {
  status: "idle"
  data: null
  error: null
} | {
  status: "loading"
  data: null
  error: null
} | {
  status: "succeeded"
  data: ConversationSummary[]
  error: null
} | {
  status: "failed"
  data: null
  error: string
}

const conversationsSummarySlice = createSlice({
  name: "conversations_summary",
  initialState: {
    status: "idle",
    data: null,
    error: null
  } as ConversationSummaryState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(populateConversationsSummary.pending, (state) => {
        state.status = "loading";
        state.data = null;
      })
      .addCase(populateConversationsSummary.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(populateConversationsSummary.rejected, (state, action) => {
        state.status = "failed";
        state.data = null;
        state.error = action.error.message;
      })
  }
});

export default conversationsSummarySlice.reducer;
export { populateConversationsSummary }
