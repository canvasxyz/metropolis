// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { RouteComponentProps } from "react-router-dom"
import React from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { populateConversationsStore, handleCreateConversationSubmit } from "../../actions"

import Url from "../../util/url"
import { RootState } from "../../util/types"
import { Box, Heading, Button, Text, Card, jsx } from "theme-ui"

function Conversation({ c, i, goToConversation }) {
  return (
    <Card sx={{ "overflow-wrap": "break-word", mb: [3] }} key={i}>
      <Text sx={{ fontWeight: 700, mb: [2] }}>{c.topic}</Text>
      <Text>{c.description}</Text>
      <Text data-test-id="embed-page">{c.parent_url ? `Embedded on ${c.parent_url}` : null}</Text>
      <Text sx={{ mt: [2], mb: [2] }}>{c.participant_count} participants</Text>
      <Text
        sx={{
          color: "primary",
          cursor: "pointer",
          "&:hover": { textDecoration: "underline" },
        }}
        onClick={goToConversation.bind(this, true)}
      >
        Vote
      </Text>
      <Text
        sx={{
          color: "primary",
          cursor: "pointer",
          "&:hover": { textDecoration: "underline" },
        }}
        onClick={goToConversation.bind(this, false)}
      >
        Manage
      </Text>
    </Card>
  )
}

Conversation.propTypes = {
  c: PropTypes.shape({
    topic: PropTypes.string,
    description: PropTypes.string,
    parent_url: PropTypes.string,
    participant_count: PropTypes.number,
  }),
  i: PropTypes.number.isRequired,
  goToConversation: PropTypes.func.isRequired,
}

class Conversations extends React.Component<
  {
    dispatch: Function
    error: Response
    loading: boolean
    conversations: Array<{ conversation_id: string }>
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

  onNewClicked() {
    this.props.dispatch(handleCreateConversationSubmit())
  }

  componentDidMount() {
    this.props.dispatch(populateConversationsStore())
    // loading true or just do that in constructor
    // check your connectivity and try again
  }

  goToConversation = (conversation_id) => {
    return (participate) => {
      if (this.props.history.pathname === "other-conversations") {
        window.open(`${Url.urlPrefix}${conversation_id}`, "_blank")
        return
      }
      if (participate) {
        this.props.history.push(`/c/${conversation_id}`)
      } else {
        this.props.history.push(`/m/${conversation_id}`)
      }
    }
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
      <Box>
        <Heading
          as="h3"
          sx={{
            fontSize: [3, null, 4],
            lineHeight: "body",
            mb: [3, null, 4],
          }}
        >
          All Conversations
        </Heading>
        <Box sx={{ mb: [3, null, 4] }}>
          <Button onClick={this.onNewClicked.bind(this)}>Create new conversation</Button>
        </Box>
        <Box>
          <Box sx={{ mb: [3] }}>{this.props.loading ? "Loading conversations..." : null}</Box>
          {err ? (
            <Text>{"Error loading conversations: " + err.status + " " + err.statusText}</Text>
          ) : null}
          {conversations
            ? conversations.map((c, i) => {
                return this.filterCheck(c) ? (
                  <Conversation
                    key={c.conversation_id}
                    c={c}
                    i={i}
                    goToConversation={this.goToConversation(c.conversation_id)}
                  />
                ) : null
              })
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
