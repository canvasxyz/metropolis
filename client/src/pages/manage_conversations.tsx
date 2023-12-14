/** @jsx jsx */

import React from "react"
import { Link } from "react-router-dom"
import { ConnectedProps, connect } from "react-redux"
import { Box, Heading, Button, Flex, jsx } from "theme-ui"

import {
  populateConversationsStore,
} from "../actions"

import ConversationRow from "../components/conversation_row"
import { AppDispatch, RootState } from "../store"

const connector = connect((state: RootState) => ({
  error: state.conversations.error,
  conversations: state.conversations.conversations,
  conversation_stats: state.stats.conversation_stats,
  loading: state.conversations.loading && state.stats.loading,
}))
type PropsFromRedux = ConnectedProps<typeof connector>
type ManageConversationsPropTypes = PropsFromRedux & {
  history: History;
  dispatch: AppDispatch;
}

class ManageConversations extends React.Component<
  ManageConversationsPropTypes,
  {
    showArchived: boolean
    filterMinParticipantCount: number
    sort: string
  }
> {
  static propTypes: {
    dispatch: AppDispatch
    error: object
    loading: unknown
    conversations: unknown
    history: object
  }

  constructor(props) {
    super(props)
    this.state = {
      showArchived: false,
      filterMinParticipantCount: 0,
      sort: "participant_count",
    }
  }

  componentDidMount() {
    this.props.dispatch(populateConversationsStore())
    // loading true or just do that in constructor
    // check your connectivity and try again
  }

  firePopulateInboxAction() {
    this.props.dispatch(populateConversationsStore())
  }

  onFilterChange() {
    this.setState({ ...this.state })
  }

  render() {
    const { conversations, conversation_stats } = this.props

    return (
      <Box sx={{ mt: [4, null, 5], mb: [5] }}>
        <Flex>
          <Heading as="h1" sx={{ flex: 1, position: "relative", top: "4px" }}>
            Manage Conversations
          </Heading>
          <Link to="/create">
            <Button variant="primary">Create New</Button>
          </Link>
        </Flex>
        {this.props.loading && (
          <Box mt={5} mb={3}>
            Loading conversations...
          </Box>
        )}
        {this.props.error && (
          <Box mt={5} mb={3}>
            Error loading conversations: {this.props.error.status} {this.props.error.statusText}
          </Box>
        )}
        <Box mt={5}>
          {conversations &&
            conversations
              .filter((c) => !c.is_archived && !c.fip_title)
              .map((c, i) => (
                <ConversationRow
                  key={c.conversation_id || i}
                  i={i}
                  c={c}
                  stats={conversation_stats[c.conversation_id]}
                  dispatch={this.props.dispatch}
                />
              ))}
          <br />
          {this.state.showArchived &&
            conversations &&
            conversations
              .filter((c) => c.is_archived && !c.fip_title)
              .map((c, i) => (
                <ConversationRow
                  key={c.conversation_id || i}
                  i={i}
                  c={c}
                  stats={conversation_stats[c.conversation_id]}
                  dispatch={this.props.dispatch}
                />
              ))}
          {!!conversations?.find((c) => c.is_archived) && (
            <Button
              variant="outlineGray"
              sx={{ mt: [3] }}
              onClick={() =>
                this.setState({ ...this.state, showArchived: !this.state.showArchived })
              }
            >
              {this.state.showArchived
                ? "Hide archived conversations"
                : "Show archived conversations"}
            </Button>
          )}
        </Box>
      </Box>
    )
  }
}


export default connector(ManageConversations)
