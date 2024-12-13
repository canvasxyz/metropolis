// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

import React from "react"
import { ConnectedProps, connect } from "react-redux"
import { Flex, Box } from "@radix-ui/themes"
import { populateZidMetadataStore, resetMetadataStore , populateAllCommentStores, populateVoterStores } from "../../actions"
import { Switch, Route, Link } from "react-router-dom"


import ConversationConfig from "./conversation-config"
import ConversationModeration from "./conversation-moderation"
import ConversationVoters from "./conversation-voters"
import ConversationReport from "./conversation-report"

import { UrlObject } from "url"
import { AppDispatch, RootState } from "../../store"

const connector = connect((state: RootState) => state.zid_metadata)
type PropsFromRedux = ConnectedProps<typeof connector>
type ConversationAdminContainerPropTypes = PropsFromRedux & {
  dispatch: AppDispatch
  location: UrlObject
  match: { url: string; path: string; params: { conversation_id: string } }
}

class ConversationAdminContainer extends React.Component<
  ConversationAdminContainerPropTypes
> {
  getCommentsRepeatedly: ReturnType<typeof setInterval>
  loadComments() {
    const { match } = this.props
    this.props.dispatch(populateAllCommentStores(match.params.conversation_id))
  }

  loadVoters() {
    const { match } = this.props
    this.props.dispatch(populateVoterStores(match.params.conversation_id))
  }

  UNSAFE_componentWillMount() {
    const pollFrequency = 60000

    this.loadZidMetadata()
    this.getCommentsRepeatedly = setInterval(() => {
      this.loadComments()
      this.loadVoters()
    }, pollFrequency)
  }

  componentDidMount() {
    this.loadComments()
    this.loadVoters()
  }

  loadZidMetadata() {
    this.props.dispatch(populateZidMetadataStore(this.props.match.params.conversation_id))
  }

  resetMetadata() {
    this.props.dispatch(resetMetadataStore())
  }

  componentWillUnmount() {
    this.resetMetadata()
    clearInterval(this.getCommentsRepeatedly)
  }

  componentDidUpdate() {
    this.loadZidMetadata()
  }

  render() {
    const { match, location } = this.props

    const url = location.pathname.split("/")[3]

    return (
      <Flex>
        {/* flex: "0 0 275" */}
        <Box mr="5" pt="5" maxWidth="50px">
          <Box mb="3">
            <Link sx={{ variant: url ? "links.nav" : "links.activeNav" }} to={`${match.url}`}>
              Configure
            </Link>
          </Box>
          <Box mb="3">
            <Link
              sx={{
                variant: url === "comments" ? "links.activeNav" : "links.nav",
              }}
              to={`${match.url}/comments`}
            >
              Moderate
            </Link>
          </Box>
          <Box mb="3">
            <Link
              sx={{
                variant: url === "voters" ? "links.activeNav" : "links.nav",
              }}
              to={`${match.url}/voters`}
            >
              Voters
            </Link>
          </Box>
          <Box mb="3">
            <Link
              sx={{
                variant: url === "report" ? "links.activeNav" : "links.nav",
              }}
              to={`${match.url}/report`}
            >
              Report
            </Link>
          </Box>
        </Box>
        {this.props.zid_metadata?.is_owner && (
          <Box sx={{ p: [4], flex: "0 0 auto", maxWidth: "35em", mx: [4] }}>
            <Switch>
              <Route exact path={`${match.path}/`} component={ConversationConfig} />
              <Route path={`${match.path}/comments`} component={ConversationModeration} />
              <Route exact path={`${match.path}/voters`} component={ConversationVoters} />
              <Route exact path={`${match.path}/report`} component={ConversationReport} />
            </Switch>
          </Box>
        )}
      </Flex>
    )
  }
}

export default connector(ConversationAdminContainer)
