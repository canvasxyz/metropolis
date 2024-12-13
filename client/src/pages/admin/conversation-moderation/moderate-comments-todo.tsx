import React from "react"
import { ConnectedProps, connect } from "react-redux"
import {
  changeCommentStatusToAccepted,
  changeCommentStatusToRejected,
  changeCommentCommentIsMeta,
} from "../../../actions"
import Comment from "./comment"
import { Comment as CommentType } from "../../../util/types"
import { Text } from "@radix-ui/themes"
import { AppDispatch, RootState } from "../../../store"

const connector = connect((state: RootState) => state.mod_comments_unmoderated)
type PropsFromRedux = ConnectedProps<typeof connector>
type ModerateCommentsTodoPropTypes = PropsFromRedux & { dispatch: AppDispatch }

class ModerateCommentsTodo extends React.Component<ModerateCommentsTodoPropTypes> {
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
          <Text color="gray">Loading unmoderated comments...</Text>
        ) : this.props.unmoderated_comments.length === 0 ? (
          <Text color="gray">No comments left to moderate</Text>
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

export default connector(ModerateCommentsTodo)
