import React from "react"
import { doPasswordResetInit } from "../../actions"
import { Button, TextField } from "@radix-ui/themes"
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
          <TextField.Root
            ref={(c) => (this.email = c)}
            placeholder="email"
            type="text"
          />
          <Button mt="4" my="2" onClick={this.handleClick.bind(this)}>
            Send password reset email
          </Button>
        </form>
      </React.Fragment>
    )
  }
}

export default PasswordResetInit
