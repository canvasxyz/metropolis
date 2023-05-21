import React from "react"
import PropTypes from "prop-types"
import { changeCommentStatusToAccepted, changeCommentCommentIsMeta } from "../../../actions"
import { connect } from "react-redux"
import Comment from "./comment"
import { RootState } from "../../../util/types"

class ModerateCommentsRejected extends React.Component<
  {
    dispatch: Function
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

  createCommentMarkup() {
    const comments = this.props.rejected_comments.map((comment, i) => {
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
    return comments
  }

  render() {
    return (
      <div>
        {this.props.rejected_comments !== null
          ? this.createCommentMarkup()
          : "Loading rejected comments..."}
      </div>
    )
  }
}

ModerateCommentsRejected.propTypes = {
  dispatch: PropTypes.func,
  rejected_comments: PropTypes.arrayOf(PropTypes.object),
}

export default connect((state: RootState) => state.mod_comments_rejected)(ModerateCommentsRejected)
