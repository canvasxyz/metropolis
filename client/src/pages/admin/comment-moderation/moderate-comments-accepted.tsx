import React from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { changeCommentStatusToRejected, changeCommentCommentIsMeta } from "../../../actions"
import Comment from "./comment"
import { RootState } from "../../../util/types"

class ModerateCommentsAccepted extends React.Component<
  {
    dispatch: Function
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

  createCommentMarkup() {
    const comments = this.props.accepted_comments.map((comment, i) => {
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
    return comments
  }

  render() {
    return (
      <div>
        {this.props.accepted_comments !== null
          ? this.createCommentMarkup()
          : "Loading accepted comments..."}
      </div>
    )
  }
}

ModerateCommentsAccepted.propTypes = {
  dispatch: PropTypes.func,
  accepted_comments: PropTypes.arrayOf(PropTypes.object),
}

export default connect((state: RootState) => state.mod_comments_accepted)(ModerateCommentsAccepted)
