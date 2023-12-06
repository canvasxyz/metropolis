/** @jsx jsx */

import React from "react"
import { doPasswordResetInit } from "../../actions"
import { Button, jsx } from "theme-ui"
import { AppDispatch } from "../../store"

class PasswordResetInit extends React.Component<{ dispatch: AppDispatch }> {
  email: HTMLInputElement

  static propTypes: {
    dispatch: AppDispatch
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
              width: "100%",
              maxWidth: "35em",
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

export default PasswordResetInit
