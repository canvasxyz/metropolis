import React from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { changeCommentStatusToRejected, changeCommentCommentIsMeta } from "../../../actions"
import Comment from "./comment"
import { Text } from "theme-ui"
import { AppDispatch, RootState } from "../../../store"

class ModerateCommentsAccepted extends React.Component<
  {
    dispatch: AppDispatch
    accepted_comments: object[]
  },
  {}
> {
  static propTypes: {}

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
          <Text sx={{ color: "mediumGray" }}>Loading accepted comments...</Text>
        ) : this.props.accepted_comments.length === 0 ? (
          <Text sx={{ color: "mediumGray" }}>No accepted comments yet</Text>
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

ModerateCommentsAccepted.propTypes = {
  dispatch: PropTypes.func,
  accepted_comments: PropTypes.arrayOf(PropTypes.object),
}

export default connect((state: RootState) => state.mod_comments_accepted)(ModerateCommentsAccepted)
