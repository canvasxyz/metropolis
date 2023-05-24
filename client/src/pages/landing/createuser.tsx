/** @jsx jsx */

import React from "react"
import { connect } from "react-redux"
import { doCreateUser, doFacebookSignin } from "../../actions"
import { Heading, Box, Text, Button, jsx } from "theme-ui"

import { Link } from "react-router-dom"
import strings from "../../intl"
import { RootState } from "../../util/types"
import { UrlObject } from "url"

const fbAppId = process.env.FB_APP_ID

class CreateUser extends React.Component<{
  location: UrlObject
  dispatch: Function
  error: XMLHttpRequest
  pending: boolean
  facebookError: string
}> {
  hname: HTMLInputElement
  email: HTMLInputElement
  password: HTMLInputElement
  password2: HTMLInputElement
  facebook_password: HTMLInputElement

  getDest() {
    return this.props.location.pathname.slice("/createuser".length)
  }

  handleLoginClicked(e) {
    e.preventDefault()
    const attrs = {
      hname: this.hname.value,
      email: this.email.value,
      password: this.password.value,
      gatekeeperTosPrivacy: true,
    }

    let dest = this.getDest()
    if (!dest.length) {
      dest = "/"
    }
    this.props.dispatch(doCreateUser(attrs, dest))
  }

  facebookButtonClicked() {
    let dest = this.getDest()
    if (!dest.length) {
      dest = "/"
    }
    this.props.dispatch(doFacebookSignin(dest))
  }

  handleFacebookPasswordSubmit() {
    let dest = this.getDest()
    if (!dest.length) {
      dest = "/"
    }
    const optionalPassword = this.facebook_password.value
    this.props.dispatch(doFacebookSignin(dest, optionalPassword))
  }

  maybeErrorMessage() {
    let markup = <React.Fragment />
    if (this.props.error) {
      markup = <div sx={{ color: "#d8403a" }}>{strings(this.props.error.responseText)}</div>
    }
    return markup
  }

  drawForm() {
    return (
      <Box>
        <form sx={{ mb: [4] }}>
          <Box sx={{ my: [2] }}>
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
              id="createUserNameInput"
              ref={(c) => (this.hname = c)}
              placeholder="name"
              type="text"
              autoComplete="name"
            />
          </Box>
          <Box sx={{ my: [2] }}>
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
              id="createUserEmailInput"
              ref={(c) => (this.email = c)}
              placeholder="email"
              type="email"
              autoComplete="username"
            />
          </Box>
          <Box sx={{ my: [2] }}>
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
              id="createUserPasswordInput"
              ref={(c) => (this.password = c)}
              placeholder="password"
              type="password"
              autoComplete="new-password"
            />
          </Box>
          <Box sx={{ my: [2] }}>
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
              id="createUserPasswordRepeatInput"
              ref={(c) => (this.password2 = c)}
              placeholder="repeat password"
              type="password"
              autoComplete="new-password"
            />
          </Box>
          {this.maybeErrorMessage()}

          <Box sx={{ mt: [3], mb: [3] }}>
            I agree to the{" "}
            <Link sx={{ variant: "styles.a" }} to="tos" tabIndex={110}>
              terms of service
            </Link>{" "}
            and{" "}
            <Link sx={{ variant: "styles.a" }} to="/privacy" tabIndex={111}>
              privacy policy
            </Link>
            .
          </Box>
          <Button
            sx={{ my: [2] }}
            id="createUserButton"
            onClick={this.handleLoginClicked.bind(this)}
          >
            {this.props.pending ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <Box sx={{ mb: [4] }}>
          Already have an account?{" "}
          <Link
            sx={{ variant: "styles.a" }}
            tabIndex={6}
            to={"/signin" + this.getDest()}
            data-section="signup-select"
          >
            Sign In
          </Link>
        </Box>

        {fbAppId && (
          <React.Fragment>
            <Button
              sx={{ my: [2] }}
              id="signupFacebookButton"
              onClick={this.facebookButtonClicked.bind(this)}
            >
              Sign up with Facebook
            </Button>
            <Text>
              If you click &apos;Sign in with Facebook&apos; and are not an existing user, you will
              be registered automatically.
            </Text>
          </React.Fragment>
        )}
      </Box>
    )
  }

  drawPasswordConnectFacebookForm() {
    return (
      <Box>
        <Text>
          A user already exists with the email address associated with this Facebook account.
        </Text>
        <Text> Please log into that user account to enable Facebook login.</Text>
        <input ref={(c) => (this.facebook_password = c)} placeholder="password" type="password" />
        <Button onClick={this.handleFacebookPasswordSubmit.bind(this)}>
          {"Connect Facebook Account"}
        </Button>
      </Box>
    )
  }

  render() {
    return (
      <React.Fragment>
        <Heading as="h1" sx={{ my: [4, null, 5], fontSize: [6] }}>
          Create Account
        </Heading>
        {this.props.facebookError !== "polis_err_user_with_this_email_exists"
          ? this.drawForm()
          : this.drawPasswordConnectFacebookForm()}
      </React.Fragment>
    )
  }
}

export default connect((state: RootState) => state.signin)(CreateUser)
