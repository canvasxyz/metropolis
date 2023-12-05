import React from "react"
import PropTypes from "prop-types"
import { changeCommentStatusToAccepted, changeCommentCommentIsMeta } from "../../../actions"
import { connect } from "react-redux"
import Comment from "./comment"
import { Text } from "theme-ui"
import { AppDispatch, RootState } from "../../../store"

class ModerateCommentsRejected extends React.Component<
  {
    dispatch: AppDispatch
    rejected_comments: object[]
  },
  {}
> {
  static propTypes: {}

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
          <Text sx={{ color: "mediumGray" }}>Loading rejected comments...</Text>
        ) : this.props.rejected_comments.length === 0 ? (
          <Text sx={{ color: "mediumGray" }}>No rejected comments yet</Text>
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

export default connect((state: RootState) => state.mod_comments_rejected)(ModerateCommentsRejected)
