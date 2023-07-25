/** @jsx jsx */

import { RouteComponentProps, Link } from "react-router-dom"
import React, { useEffect } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { Box, Grid, Heading, Button, Text, Flex, jsx } from "theme-ui"
import { TbExternalLink, TbUser, TbCheckbox } from "react-icons/tb"

import {
  populateConversationsStore,
  handleCreateConversationSubmit,
  handleCloseConversation,
  handleReopenConversation,
  populateConversationStatsStore,
} from "../actions"
import { DropdownMenu } from "../components/dropdown"

import Url from "../util/url"
import { RootState, Conversation } from "../util/types"

function ConversationRow({ c, i, stats, dispatch }) {
  useEffect(() => {
    if (!stats && !c.is_archived) {
      const until = null
      dispatch(populateConversationStatsStore(c.conversation_id, until))
    }
  }, [])

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
        <Box sx={{ lineHeight: 1.35, flex: 4 }}>
          <Box sx={{ my: [1] }}>
            {c.is_archived ? (
              <Text sx={{ color: "mediumGray" }}>{c.topic}</Text>
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
            <Text
              sx={{
                fontSize: "84%",
                color: "mediumGray",
                mt: [1],
                textOverflow: "ellipsis",
                overflow: "hidden",
                WebkitLineClamp: "3",
                WebkitBoxOrient: "vertical",
                display: "-webkit-box",
              }}
            >
              {c.description}
            </Text>
          </Box>
        </Box>
        <Box
          sx={{
            ml: [4],
            color: c.is_archived ? "mediumGray" : "mediumGray",
            fontSize: "92%",
            mt: "3px",
            flex: [3, 1],
          }}
        >
          <Box>
            {c.participant_count} voter{c.participant_count === 1 ? "" : "s"}
          </Box>
          {!c.is_archived && (
            <Box>
              {stats?.commentTimes?.length} comment{stats?.commentTimes?.length === 1 ? "" : "s"}
            </Box>
          )}
          {!c.is_archived && (
            <Box>
              {stats?.voteTimes?.length} vote{stats?.voteTimes?.length === 1 ? "" : "s"}
            </Box>
          )}
        </Box>
        {!c.is_archived ? (
          <Box sx={{ flex: 1, textAlign: "right", ml: [3], maxWidth: 60 }}>
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
          <Box sx={{ flex: 1, textAlign: "right", ml: [3], maxWidth: 60 }}>
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
    conversation_stats: any
    history: any
  },
  {
    showArchived: boolean
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
    const { conversations, conversation_stats } = this.props

    const prefillOptions = [
      {
        title: "Quick Start",
        prefill:
          "What makes you excited about being a part of this group? What was your best experience since joining?",
        bestFor: "General Organizations",
      },
      {
        title: "Delegate Onboarding",
        prefill:
          "As a delegate, what perspectives do you bring to the table? Which of these statements do you agree with?",
        bestFor: "DAOs, Formal Governance",
      },
      {
        title: "User Feedback",
        prefill:
          "How could we improve our user interface or product? Which features should we prioritize?",
        bestFor: "Startups, Product Teams",
      },
      {
        title: "Constitution Building",
        prefill:
          "Which values, practices, and processes should be included in our constitution? Who should we be inspired by?",
        bestFor: "Formal Governance",
      },
      {
        title: "Custom Prompt",
        prefillPlaceholder:
          "Write and customize your own survey. You can use case studies provided in the documentation as reference.",
        bestFor: "BYOB",
      },
    ]

    return (
      <Box sx={{ mt: [4, null, 5], mb: [5] }}>
        <Heading as="h1">New Conversation</Heading>
        <Box sx={{ mt: 5, mb: 6 }}>
          <Grid width={240}>
            {prefillOptions.map((option, index) => (
              <Box
                key={index}
                sx={{
                  border: "1px solid",
                  borderColor: "lighterGray",
                  borderRadius: "7px",
                  cursor: "pointer",
                  lineHeight: "1.4",
                  "&:hover": { borderColor: "primary" },
                  px: [4],
                  py: [3],
                }}
                onClick={() => {
                  if (!confirm("Create a new " + option.title + " survey?")) return
                  this.props.dispatch(handleCreateConversationSubmit(option.title, option.prefill))
                }}
              >
                <Box sx={{ my: [1], fontWeight: "700" }}>{option.title}</Box>
                <Box sx={{ my: [2], fontSize: ".9em", fontStyle: "italic", color: "mediumGray" }}>
                  {option.prefill || option.prefillPlaceholder}
                </Box>
                {option.bestFor && (
                  <Box
                    sx={{
                      fontSize: ".9em",
                      color: "mediumGray",
                      fontWeight: 600,
                      mb: [2],
                    }}
                  >
                    Best for: {option.bestFor}
                  </Box>
                )}
              </Box>
            ))}
          </Grid>
        </Box>
        <Heading as="h1">Manage Conversations</Heading>
        <Box mt={5}>
          <Box sx={{ mb: [3] }}>{this.props.loading ? "Loading conversations..." : null}</Box>
          {err ? (
            <Text>{"Error loading conversations: " + err.status + " " + err.statusText}</Text>
          ) : null}
          {conversations &&
            conversations
              .filter((c) => !c.is_archived)
              .map(
                (c, i) =>
                  this.filterCheck(c) && (
                    <ConversationRow
                      key={c.conversation_id}
                      i={i}
                      c={c}
                      stats={conversation_stats[c.conversation_id]}
                      dispatch={this.props.dispatch}
                    />
                  )
              )}
          <br />
          {this.state.showArchived &&
            conversations &&
            conversations
              .filter((c) => c.is_archived)
              .map(
                (c, i) =>
                  this.filterCheck(c) && (
                    <ConversationRow
                      key={c.conversation_id}
                      i={i}
                      c={c}
                      stats={conversation_stats[c.conversation_id]}
                      dispatch={this.props.dispatch}
                    />
                  )
              )}
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

export default connect((state: RootState) => state.stats)(
  connect((state: RootState) => state.conversations)(Conversations)
)
