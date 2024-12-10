import React from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { Flex, Box, Text, Button, Card } from "@radix-ui/themes"
import { AppDispatch, RootState } from "../../../store"

class Comment extends React.Component<
  {
    dispatch: AppDispatch
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
      <Card
        mb="3"
        style={{ width:"100%", maxWidth: "35em" }}
      >
        <Flex gap="1" direction="column">
          <Text>{this.props.comment.txt}</Text>
          <Flex
            align="center"
            width="100%"
            gap="1"
          >
            {this.props.acceptButton ? (
              <Button onClick={this.onAcceptClicked.bind(this)}>
                {this.props.acceptButtonText}
              </Button>
            ) : null}
            {this.props.rejectButton ? (
              <Button onClick={this.onRejectClicked.bind(this)}>
                {this.props.rejectButtonText}
              </Button>
            ) : null}
            <Box flexGrow="1" />
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
  state.zid_metadata.zid_metadata
})(Comment)
