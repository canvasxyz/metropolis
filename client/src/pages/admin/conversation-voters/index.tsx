import React from "react"
import { ConnectedProps, connect } from "react-redux"
import { Heading, Box } from "@radix-ui/themes"
import { UrlObject } from "url"
import ComponentHelpers from "../../../util/component-helpers"
import { formatTimeAgo } from "../../../util/misc"
import { AppDispatch, RootState } from "../../../store"
import NoPermission from "../no-permission"

const connector = connect((state: RootState) => ({
  conversation_voters: state.conversation_voters,
}))
type PropsFromRedux = ConnectedProps<typeof connector>
type ConversationVotersPropTypes = PropsFromRedux & {
  dispatch: AppDispatch
  match: { params: { conversation_id: string }; url: string; path: string }
  location: UrlObject
  seed: object[]
}

class ConversationVoters extends React.Component<ConversationVotersPropTypes> {
  render() {
    if (ComponentHelpers.shouldShowPermissionsError(this.props)) {
      return <NoPermission />
    }
    const {
      match,
      conversation_voters: { voters },
    } = this.props
    const voterList = voters[match.params.conversation_id]

    return (
      <Box>
        <Heading
          as="h3"
          size={{initial: "3", md: "4"}}
          mb={{initial: "3", md: "4"}}
        >
          Voters
        </Heading>
        <Box mb="4">{voterList?.length} voters</Box>
        <Box mb="4">
          {voterList?.map((voter, index) => (
            <Box key={index} mb="2">
              <Box>{voter.hname || "Anonymous"}</Box>
              <Box>{voter.vote_count} votes</Box>
              <Box>First seen {formatTimeAgo(+voter.created)} </Box>
              <Box>Last seen {formatTimeAgo(+voter.last_interaction)}</Box>
            </Box>
          ))}
        </Box>
      </Box>
    )
  }
}

export default connector(ConversationVoters)
