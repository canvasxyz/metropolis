// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.
/** @jsx jsx */

import React from "react"
import { connect } from "react-redux"
import { Flex, Box, jsx } from "theme-ui"
import { populateZidMetadataStore, resetMetadataStore } from "../../actions"
import { Switch, Route, Link } from "react-router-dom"
import { RootState } from "../../util/types"

import ConversationConfig from "./conversation-config"
import ConversationModeration from "./conversation-moderation"
import ConversationReport from "./conversation-report"

import { UrlObject } from "url"

class ConversationAdminContainer extends React.Component<
  {
    dispatch: Function
    match: { url: string; path: string; params: { conversation_id: string } }
    zid_metadata: { is_mod: boolean }
    location: UrlObject
  },
  {}
> {
  loadZidMetadata() {
    this.props.dispatch(populateZidMetadataStore(this.props.match.params.conversation_id))
  }

  resetMetadata() {
    this.props.dispatch(resetMetadataStore())
  }

  UNSAFE_componentWillMount() {
    this.loadZidMetadata()
  }

  componentWillUnmount() {
    this.resetMetadata()
  }

  componentDidUpdate() {
    this.loadZidMetadata()
  }

  render() {
    const { match, location } = this.props

    const url = location.pathname.split("/")[3]

    return (
      <Flex>
        <Box sx={{ mr: [5], pt: [5], flex: "0 0 275", maxWidth: "50px" }}>
          <Box sx={{ mb: [3] }}>
            <Link sx={{ variant: url ? "links.nav" : "links.activeNav" }} to={`${match.url}`}>
              Configure
            </Link>
          </Box>
          <Box sx={{ mb: [3] }}>
            <Link
              sx={{
                variant: url === "comments" ? "links.activeNav" : "links.nav",
              }}
              to={`${match.url}/comments`}
            >
              Moderate
            </Link>
          </Box>
          <Box sx={{ mb: [3] }}>
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
        {this.props.zid_metadata?.is_mod && (
          <Box sx={{ p: [4], flex: "0 0 auto", maxWidth: "35em", mx: [4] }}>
            <Switch>
              <Route exact path={`${match.path}/`} component={ConversationConfig} />
              <Route path={`${match.path}/comments`} component={ConversationModeration} />
              <Route exact path={`${match.path}/report`} component={ConversationReport} />
            </Switch>
          </Box>
        )}
      </Flex>
    )
  }
}

export default connect((state: RootState) => state.zid_metadata)(ConversationAdminContainer)
