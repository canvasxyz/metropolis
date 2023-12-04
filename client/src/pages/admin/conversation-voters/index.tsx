/** @jsx jsx */

import ComponentHelpers from "../../../util/component-helpers"

import NoPermission from "../no-permission"
import React from "react"
import { connect } from "react-redux"
import { Heading, Flex, Box, jsx } from "theme-ui"
import { RootState } from "../../../util/types"
import { formatTime } from "../../../util/misc"

import { Switch, Route, Link } from "react-router-dom"
import { UrlObject } from "url"
import { AppDispatch } from "../../../store"

class ConversationVoters extends React.Component<{
  dispatch: AppDispatch
  match: { params: { conversation_id: string }; url: string; path: string }
  conversation_voters: { voters: object[] }
  location: UrlObject
  seed: object[]
}> {
  render() {
    if (ComponentHelpers.shouldShowPermissionsError(this.props)) {
      return <NoPermission />
    }
    const {
      match,
      location,
      conversation_voters: { voters },
    } = this.props
    const voterList = voters[match.params.conversation_id]

    const url = location.pathname.split("/")[4]

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
          Voters
        </Heading>
        <Box sx={{ mb: [4] }}>{voterList?.length} voters</Box>
        <Box sx={{ mb: [4] }}>
          {voterList?.map((voter, index) => (
            <Box key={index} sx={{ mb: [2] }}>
              <Box>{voter.hname || "Anonymous"}</Box>
              <Box>{voter.vote_count} votes</Box>
              <Box>First seen {formatTime(+voter.created)} </Box>
              <Box>Last seen {formatTime(+voter.last_interaction)}</Box>
            </Box>
          ))}
        </Box>
      </Box>
    )
  }
}

export default connect((state: RootState) => state.zid_metadata)(
  connect((state: RootState) => {
    return {
      conversation_voters: state.conversation_voters,
    }
  })(ConversationVoters)
)
