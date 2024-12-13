import React from "react"
import PropTypes from "prop-types"
import { changeCommentStatusToAccepted, changeCommentCommentIsMeta } from "../../../actions"
import { ConnectedProps, connect } from "react-redux"
import Comment from "./comment"
import { Text } from "@radix-ui/themes"
import { AppDispatch, RootState } from "../../../store"

const connector = connect((state: RootState) => state.mod_comments_rejected)
type PropsFromRedux = ConnectedProps<typeof connector>
type ModerateCommentsRejectedPropTypes = PropsFromRedux & { dispatch: AppDispatch }

class ModerateCommentsRejected extends React.Component<ModerateCommentsRejectedPropTypes> {
  static propTypes: object

  onCommentAccepted(comment) {
    this.props.dispatch(changeCommentStatusToAccepted(comment))
  }

  toggleIsMetaHandler(comment, is_meta) {
    this.props.dispatch(changeCommentCommentIsMeta(comment, is_meta))
  }

  render() {
    return (
      <div>
        {this.props.rejected_comments === null ? (
          <Text color="gray">Loading rejected comments...</Text>
        ) : this.props.rejected_comments.length === 0 ? (
          <Text color="gray">No rejected comments yet</Text>
        ) : (
          this.props.rejected_comments.map((comment, i) => {
            return (
              <Comment
                key={i}
                acceptButton
                acceptButtonText="accept"
                acceptClickHandler={this.onCommentAccepted.bind(this)}
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

ModerateCommentsRejected.propTypes = {
  dispatch: PropTypes.func,
  rejected_comments: PropTypes.arrayOf(PropTypes.object),
}

export default connector(ModerateCommentsRejected)
