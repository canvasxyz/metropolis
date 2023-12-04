import React from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import {
  changeCommentStatusToAccepted,
  changeCommentStatusToRejected,
  changeCommentCommentIsMeta,
} from "../../../actions"
import Comment from "./comment"
import { RootState, Comment as CommentType } from "../../../util/types"
import { Text } from "theme-ui"
import { AppDispatch } from "../../../store"

class ModerateCommentsTodo extends React.Component<
  {
    dispatch: AppDispatch
    unmoderated_comments: CommentType[]
  },
  {}
> {
  static propTypes: {}

  onCommentAccepted(comment) {
    this.props.dispatch(changeCommentStatusToAccepted(comment))
  }

  onCommentRejected(comment) {
    this.props.dispatch(changeCommentStatusToRejected(comment))
  }

  toggleIsMetaHandler(comment, is_meta) {
    this.props.dispatch(changeCommentCommentIsMeta(comment, is_meta))
  }

  render() {
    const max = 100
    return (
      <div>
        {this.props.unmoderated_comments === null ? (
          <Text sx={{ color: "mediumGray" }}>Loading unmoderated comments...</Text>
        ) : this.props.unmoderated_comments.length === 0 ? (
          <Text sx={{ color: "mediumGray" }}>No comments left to moderate</Text>
        ) : (
          this.props.unmoderated_comments.slice(0, max).map((comment, i) => {
            return (
              <Comment
                key={i}
                acceptButton
                rejectButton
                acceptClickHandler={this.onCommentAccepted.bind(this)}
                rejectClickHandler={this.onCommentRejected.bind(this)}
                acceptButtonText="accept"
                rejectButtonText="reject"
                isMetaCheckbox
                toggleIsMetaHandler={this.toggleIsMetaHandler.bind(this)}
                comment={comment}
              />
            )
          })
        )}
      </div>
    )
  }
}

ModerateCommentsTodo.propTypes = {
  dispatch: PropTypes.func,
  unmoderated_comments: PropTypes.arrayOf(PropTypes.object),
}

export default connect((state: RootState) => state.mod_comments_unmoderated)(ModerateCommentsTodo)
