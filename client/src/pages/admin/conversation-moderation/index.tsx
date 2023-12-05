/** @jsx jsx */

import ComponentHelpers from "../../../util/component-helpers"

import NoPermission from "../no-permission"
import React from "react"
import { ConnectedProps, connect } from "react-redux"
import { Heading, Flex, Box, jsx } from "theme-ui"

import ModerateCommentsTodo from "./moderate-comments-todo"
import ModerateCommentsAccepted from "./moderate-comments-accepted"
import ModerateCommentsRejected from "./moderate-comments-rejected"

import { Switch, Route, Link } from "react-router-dom"
import { UrlObject } from "url"
import { AppDispatch, RootState } from "../../../store"



const connector = connect((state: RootState) =>
  ({
    ...state.zid_metadata,
    unmoderated: state.mod_comments_unmoderated,
    accepted: state.mod_comments_accepted,
    rejected: state.mod_comments_rejected,
    seed: state.seed_comments,
  })
)
type PropsFromRedux = ConnectedProps<typeof connector>
type CommentModerationPropTypes = PropsFromRedux & {
  dispatch: AppDispatch
  match: { params: { conversation_id: string }; url: string; path: string }
  location: UrlObject
}

class CommentModeration extends React.Component<CommentModerationPropTypes> {
  render() {
    if (ComponentHelpers.shouldShowPermissionsError(this.props)) {
      return <NoPermission />
    }
    const { match, location } = this.props

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
          Moderate
        </Heading>
        <Flex sx={{ mb: [4] }}>
          <Link
            sx={{
              mr: [4],
              variant: url ? "links.nav" : "links.activeNav",
            }}
            to={`${match.url}`}
          >
            Unmoderated{" "}
            {this.props.unmoderated.unmoderated_comments
              ? this.props.unmoderated.unmoderated_comments.length
              : null}
          </Link>
          <Link
            sx={{
              mr: [4],
              variant: url === "accepted" ? "links.activeNav" : "links.nav",
            }}
            to={`${match.url}/accepted`}
          >
            Accepted{" "}
            {this.props.accepted.accepted_comments
              ? this.props.accepted.accepted_comments.length
              : null}
          </Link>
          <Link
            sx={{
              mr: [4],
              variant: url === "rejected" ? "links.activeNav" : "links.nav",
            }}
            to={`${match.url}/rejected`}
          >
            Rejected{" "}
            {this.props.rejected.rejected_comments
              ? this.props.rejected.rejected_comments.length
              : null}
          </Link>
        </Flex>
        <Box>
          <Switch>
            <Route exact path={`${match.url}`} component={ModerateCommentsTodo} />
            <Route exact path={`${match.url}/accepted`} component={ModerateCommentsAccepted} />
            <Route exact path={`${match.url}/rejected`} component={ModerateCommentsRejected} />
          </Switch>
        </Box>
      </Box>
    )
  }
}

export default connector(CommentModeration)
