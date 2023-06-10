/** @jsx jsx */

import { RouteComponentProps, Link } from "react-router-dom"
import React from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { Box, Heading, Button, Text, Flex, jsx } from "theme-ui"
import { TbExternalLink, TbUser, TbCheckbox } from "react-icons/tb"

import {
  populateConversationsStore,
  handleCreateConversationSubmit,
  handleCloseConversation,
  handleReopenConversation,
} from "../actions"
import { DropdownMenu } from "../components/dropdown"

import Url from "../util/url"
import { RootState, Conversation } from "../util/types"

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
              mt: "6px",
              filter: c.is_archived ? "grayscale(1) opacity(0.4)" : undefined,
            }}
          />
        </Box>
        <Box sx={{ lineHeight: 1.35, flex: "1 1 auto", ml: [3], maxWidth: "50%" }}>
          <Box sx={{ my: [1] }}>
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
          </Box>
          <Box sx={{ my: [2] }}>
            <Text sx={{ fontSize: "84%", color: "mediumGray", mt: [1] }}>
              {!c.is_archived && (c.is_active ? "Voting Open" : "Voting Closed")}
            </Text>
          </Box>
          <Box sx={{ my: [2] }}>
            <Text sx={{ fontSize: "84%", color: "mediumGray", mt: [1] }}>{c.description}</Text>
          </Box>
        </Box>
        <Box sx={{ ml: [4], color: c.is_archived ? "lightGray" : "mediumGray" }}>
          {c.participant_count}
          <Text sx={{ display: ["inline", "none"] }}>
            <TbUser />
          </Text>{" "}
          <Text sx={{ display: ["none", "inline"] }}>participants</Text>
        </Box>
        {/*
        <Box sx={{ ml: [4], color: c.is_archived ? "lightGray" : "mediumGray" }}>
          {c.vote_count}
          <Text sx={{ display: ["inline", "none"] }}>
            <TbCheckbox />
          </Text>{" "}
          <Text sx={{ display: ["none", "inline"] }}>votes</Text>
          </Box>*/}
        {!c.is_archived ? (
          <Box sx={{ flex: 1, textAlign: "right", mx: [3] }}>
            <DropdownMenu
              rightAlign
              variant="outlineGray"
              buttonSx={{ textAlign: "left" }}
              options={[
                {
                  name: "Configure",
                  onClick: () => {
                    document.location = `/m/${c.conversation_id}`
                  },
                },
                {
                  name: "Moderate",
                  onClick: () => {
                    document.location = `/m/${c.conversation_id}/comments`
                  },
                },
                {
                  name: "See results",
                  onClick: () => {
                    document.location = `/m/${c.conversation_id}/report`
                  },
                },
                {
                  name: (
                    <React.Fragment>
                      Open survey <TbExternalLink />
                    </React.Fragment>
                  ),
                  onClick: () => {
                    window.open(`/c/${c.conversation_id}`)
                  },
                },
                {
                  name: "Move to trash",
                  onClick: () => {
                    if (!confirm("Move this conversation to the trash?")) return
                    dispatch(handleCloseConversation(c.conversation_id))
                  },
                  sx: { variant: "buttons.outlineRed" },
                },
              ]}
            />
          </Box>
        ) : (
          <Box sx={{ flex: 1, textAlign: "right", mx: [3] }}>
            <DropdownMenu
              rightAlign
              options={[
                {
                  name: "Recover from trash",
                  onClick: () => {
                    if (confirm("Reopen this archived conversation?")) {
                      dispatch(handleReopenConversation(c.conversation_id))
                    }
                  },
                },
              ]}
            />
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
