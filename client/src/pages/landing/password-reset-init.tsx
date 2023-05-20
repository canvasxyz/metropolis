/** @jsx jsx */

import React from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { doPasswordResetInit } from "../../actions"
import { Button, jsx } from "theme-ui"

class PasswordResetInit extends React.Component<{ dispatch: Function }, {}> {
  email: HTMLInputElement

  static propTypes: {
    dispatch: Function
  }

  handleClick(e) {
    e.preventDefault()

    const attrs = {
      email: this.email.value,
    }

    this.props.dispatch(doPasswordResetInit(attrs))
  }

  render() {
    return (
      <React.Fragment>
        <h1>Password Reset</h1>
        <form>
          <input
            sx={{
              fontFamily: "body",
              fontSize: [2],
              width: "35em",
              borderRadius: 2,
              padding: [2],
              border: "1px solid",
              borderColor: "mediumGray",
            }}
            ref={(c) => (this.email = c)}
            placeholder="email"
            type="text"
          />
          <Button sx={{ mt: [4], my: [2] }} onClick={this.handleClick.bind(this)}>
            Send password reset email
          </Button>
        </form>
      </React.Fragment>
    )
  }
}

PasswordResetInit.propTypes = {
  dispatch: PropTypes.func,
}

export default connect()(PasswordResetInit)
