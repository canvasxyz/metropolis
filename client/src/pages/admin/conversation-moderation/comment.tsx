import React from "react"
import { connect } from "react-redux"
import { Flex, Box, Text, Button, Card } from "theme-ui"
import { RootState } from "../../../util/types"
import { AppDispatch } from "../../../store"

type CommentPropTypes = {
  dispatch: AppDispatch
  acceptClickHandler: (comment) => void
  rejectClickHandler: (comment) => void
  toggleIsMetaHandler: (comment, isChecked: boolean) => void
  acceptButton: boolean
  acceptButtonText: string
  rejectButton: boolean
  rejectButtonText: string
  isMetaCheckbox: boolean
  comment: { txt: string; is_meta: boolean }
}

class Comment extends React.Component<CommentPropTypes> {
  is_meta: HTMLInputElement

  onAcceptClicked() {
    this.props.acceptClickHandler(this.props.comment)
  }

  onRejectClicked() {
    this.props.rejectClickHandler(this.props.comment)
  }

  onIsMetaClicked() {
    this.props.toggleIsMetaHandler(this.props.comment, this.is_meta.checked)
  }

  render() {
    return (
      <Card sx={{ mb: [3], width: "100%", maxWidth: "35em" }}>
        <Box>
          <Text sx={{ mb: [3] }}>{this.props.comment.txt}</Text>
          <Flex
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Box>
              {this.props.acceptButton ? (
                <Button sx={{ mr: [3] }} onClick={this.onAcceptClicked.bind(this)}>
                  {this.props.acceptButtonText}
                </Button>
              ) : null}
              {this.props.rejectButton ? (
                <Button onClick={this.onRejectClicked.bind(this)}>
                  {this.props.rejectButtonText}
                </Button>
              ) : null}
            </Box>
            <Flex sx={{ alignItems: "center" }}>
              {this.props.isMetaCheckbox ? (
                <label>
                  <input
                    type="checkbox"
                    ref={(c) => (this.is_meta = c)}
                    checked={this.props.comment.is_meta}
                    onChange={this.onIsMetaClicked.bind(this)}
                  />
                  Mark as metadata
                </label>
              ) : null}
            </Flex>
          </Flex>
        </Box>
      </Card>
    )
  }
}


export default connect((state: RootState) =>
  state.zid_metadata.zid_metadata
)(Comment)
