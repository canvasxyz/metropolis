/** @jsx jsx */

import { RouteComponentProps, Link } from "react-router-dom"
import React from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import {
  populateConversationsStore,
  handleCreateConversationSubmit,
  handleCloseConversation,
  handleReopenConversation,
} from "../actions"

import Url from "../util/url"
import { RootState, Conversation } from "../util/types"
import { Box, Heading, Button, Text, Flex, jsx } from "theme-ui"
import { TbExternalLink, TbUser } from "react-icons/tb"

function ConversationRow({ c, i, dispatch }) {
  return (
    <Box>
      <Flex
        sx={{
          overflowWrap: "break-word",
          py: [3],
          bb: [1],
          width: "100%",
          borderBottom: "1px solid #e6e7e8",
          borderTop: i === 0 ? "1px solid #e6e7e8" : "none",
        }}
      >
        <Box>
          <img
            src="/polldoc.png"
            sx={{
              width: 16,
              mt: "3px",
              filter: c.is_archived ? "grayscale(1) opacity(0.4)" : undefined,
            }}
          />
        </Box>
        <Box sx={{ flex: "1 1 auto", ml: [3], maxWidth: "50%" }}>
          {c.is_archived ? (
            <Text sx={{ color: "lightGray" }}>{c.topic}</Text>
          ) : (
            <Link
              sx={{
                variant: "links.text",
                cursor: "pointer",
                fontWeight: 600,
              }}
              to={`/c/${c.conversation_id}`}
            >
              {c.topic}
            </Link>
          )}
          <Text data-test-id="embed-page">
            {c.parent_url ? `Embedded on ${c.parent_url}` : null}
          </Text>
          <Text sx={{ fontSize: "84%", color: "mediumGray", mt: [1] }}>{c.description}</Text>
        </Box>
        {!c.is_archived ? (
          <React.Fragment>
            <Box sx={{ ml: [4], color: "mediumGray" }}>
              <Link sx={{ variant: "links.text" }} to={`/m/${c.conversation_id}/report`}>
                Reports
              </Link>
              <Text>{c.is_active ? "Voting Open" : "Voting Closed"}</Text>
            </Box>
            <Box sx={{ ml: [4], color: "mediumGray" }}>
              <Text>
                {c.participant_count}
                <TbUser />
              </Text>
            </Box>
            <Box sx={{ ml: [3] }}>
              <Link sx={{ variant: "links.text" }} to={`/m/${c.conversation_id}`}>
                Edit
              </Link>
            </Box>
            <Box sx={{ ml: [3], mr: [3] }}>
              <Text
                sx={{ variant: "links.text" }}
                onClick={() => {
                  if (confirm("Archive this conversation?")) {
                    dispatch(handleCloseConversation(c.conversation_id))
                  }
                }}
              >
                Close
              </Text>
            </Box>
          </React.Fragment>
        ) : (
          <Box sx={{ ml: [3], mr: [3] }}>
            <Text
              sx={{ variant: "links.text", fontWeight: "400", color: "lightGray" }}
              onClick={() => {
                if (confirm("Reopen this archived conversation?")) {
                  dispatch(handleReopenConversation(c.conversation_id))
                }
              }}
            >
              Reopen
            </Text>
          </Box>
        )}
      </Flex>
    </Box>
  )
}

class Conversations extends React.Component<
  {
    dispatch: Function
    error: Response
    loading: boolean
    conversations: Array<Conversation>
    history: any
  },
  {
    filterMinParticipantCount: number
    sort: string
  }
> {
  static propTypes: {
    dispatch: Function
    error: object
    loading: unknown
    conversations: unknown
    history: object
  }

  constructor(props) {
    super(props)
    this.state = {
      filterMinParticipantCount: 0,
      sort: "participant_count",
    }
  }

  componentDidMount() {
    this.props.dispatch(populateConversationsStore())
    // loading true or just do that in constructor
    // check your connectivity and try again
  }

  filterCheck(c) {
    let include = true

    if (c.participant_count < this.state.filterMinParticipantCount) {
      include = false
    }

    if (this.props.history.pathname === "other-conversations") {
      // filter out conversations i do own
      include = !c.is_owner
    }

    if (this.props.history.pathname !== "other-conversations" && !c.is_owner) {
      // if it's not other convos and i'm not the owner, don't show it
      // filter out convos i don't own
      include = false
    }

    return include
  }

  firePopulateInboxAction() {
    this.props.dispatch(populateConversationsStore())
  }

  onFilterChange() {
    this.setState({ ...this.state })
  }

  render() {
    const err = this.props.error
    const { conversations } = this.props

    return (
      <Box sx={{ mb: [5] }}>
        <Heading as="h1">Manage Conversations</Heading>
        <Box sx={{ mt: [4], mb: [6] }}>
          <Button
            onClick={() => {
              const title = prompt("Title of new conversation?")
              if (!title || !title.trim()) return
              this.props.dispatch(handleCreateConversationSubmit(title))
            }}
          >
            Create new conversation
          </Button>
        </Box>
        <Box>
          <Box sx={{ mb: [3] }}>{this.props.loading ? "Loading conversations..." : null}</Box>
          {err ? (
            <Text>{"Error loading conversations: " + err.status + " " + err.statusText}</Text>
          ) : null}
          {conversations
            ? conversations
                .filter((c) => !c.is_archived)
                .map((c, i) =>
                  this.filterCheck(c) ? (
                    <ConversationRow
                      key={c.conversation_id}
                      i={i}
                      c={c}
                      dispatch={this.props.dispatch}
                    />
                  ) : null
                )
            : null}
          <br />
          {conversations
            ? conversations
                .filter((c) => c.is_archived)
                .map((c, i) =>
                  this.filterCheck(c) ? (
                    <ConversationRow
                      key={c.conversation_id}
                      i={i}
                      c={c}
                      dispatch={this.props.dispatch}
                    />
                  ) : null
                )
            : null}
        </Box>
      </Box>
    )
  }
}

Conversations.propTypes = {
  dispatch: PropTypes.func,
  error: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.shape({
      status: PropTypes.number,
      statusText: PropTypes.string,
    }),
  ]),
  loading: PropTypes.bool,
  conversations: PropTypes.arrayOf(
    PropTypes.shape({
      conversation_id: PropTypes.string,
    })
  ),
  history: PropTypes.shape({
    pathname: PropTypes.string,
    push: PropTypes.func,
  }),
}

export default connect((state: RootState) => state.conversations)(Conversations)
