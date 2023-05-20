import React from "react"
import { connect } from "react-redux"

class PasswordResetInitDone extends React.Component<{}> {
  render() {
    return <p>Check your email for a password reset link</p>
  }
}

export default connect()(PasswordResetInitDone)
