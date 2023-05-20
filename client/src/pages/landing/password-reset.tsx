import React from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { doPasswordReset } from "../../actions"
import { UrlObject } from "url"

class PasswordReset extends React.Component<{ dispatch: Function; location: UrlObject }, {}> {
  passwordRepeat: HTMLInputElement
  password: HTMLInputElement
  static propTypes: { dispatch: Function; location: object }

  handleClick(e) {
    e.preventDefault()
    const attrs = {
      newPassword: this.password.value,
      pwresettoken: this.props.location.pathname.slice("/pwreset/".length),
    }

    if (attrs.newPassword !== this.passwordRepeat.value) {
      alert("Passwords need to match")
      return
    }

    this.props.dispatch(doPasswordReset(attrs))
  }

  render() {
    return (
      <React.Fragment>
        <h1>Password Reset</h1>
        <form>
          <input ref={(c) => (this.password = c)} placeholder="new password" type="password" />
          <input
            ref={(c) => (this.passwordRepeat = c)}
            placeholder="repeat new password"
            type="password"
          />
          <button onClick={this.handleClick.bind(this)}>Set new password</button>
        </form>
      </React.Fragment>
    )
  }
}

PasswordReset.propTypes = {
  dispatch: PropTypes.func,
  location: PropTypes.object,
}

export default connect()(PasswordReset)
