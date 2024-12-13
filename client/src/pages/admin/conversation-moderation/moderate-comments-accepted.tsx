import React from "react"
import { ConnectedProps, connect } from "react-redux"
import { changeCommentStatusToRejected, changeCommentCommentIsMeta } from "../../../actions"
import Comment from "./comment"
import { AppDispatch, RootState } from "../../../store"
import { Text } from "@radix-ui/themes"

const connector = connect((state: RootState) => state.mod_comments_accepted)
type PropsFromRedux = ConnectedProps<typeof connector>
type ModerateCommentsAcceptedPropTypes = PropsFromRedux & { dispatch: AppDispatch }

class ModerateCommentsAccepted extends React.Component<ModerateCommentsAcceptedPropTypes> {

  onCommentRejected(comment) {
    this.props.dispatch(changeCommentStatusToRejected(comment))
  }

  toggleIsMetaHandler(comment, is_meta) {
    this.props.dispatch(changeCommentCommentIsMeta(comment, is_meta))
  }

  render() {
    return (
      <div>
        {this.props.accepted_comments === null ? (
          <Text color="gray" >Loading accepted comments...</Text>
        ) : this.props.accepted_comments.length === 0 ? (
          <Text color="gray">No accepted comments yet</Text>
        ) : (
          this.props.accepted_comments.map((comment, i) => {
            return (
              <Comment
                key={i}
                rejectButton
                rejectClickHandler={this.onCommentRejected.bind(this)}
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


export default connector(ModerateCommentsAccepted)
