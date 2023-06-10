import React from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { Flex, Box, Text, Button, Card } from "theme-ui"
import { RootState } from "../../../util/types"

class Comment extends React.Component<
  {
    dispatch: Function
    acceptClickHandler: Function
    rejectClickHandler: Function
    toggleIsMetaHandler: Function
    acceptButton: boolean
    acceptButtonText: string
    rejectButton: boolean
    rejectButtonText: string
    isMetaCheckbox: boolean
    comment: { txt: string; is_meta: boolean }
  },
  {}
> {
  is_meta: HTMLInputElement

  static propTypes: any

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

Comment.propTypes = {
  dispatch: PropTypes.func,
  acceptClickHandler: PropTypes.func,
  rejectClickHandler: PropTypes.func,
  toggleIsMetaHandler: PropTypes.func,
  acceptButton: PropTypes.bool,
  acceptButtonText: PropTypes.string,
  rejectButton: PropTypes.bool,
  rejectButtonText: PropTypes.string,
  isMetaCheckbox: PropTypes.bool,
  comment: PropTypes.shape({
    txt: PropTypes.string,
    is_meta: PropTypes.bool,
  }),
}

export default connect((state: RootState) => {
  conversation: state.zid_metadata.zid_metadata
})(Comment)
