/** @jsx jsx */

import React from "react"
import { connect } from "react-redux"
import { doSignin, doFacebookSignin, Action } from "../../actions"
import { Link, Redirect } from "react-router-dom"
import { Heading, Box, Text, Button, jsx } from "theme-ui"

import strings from "../../intl"
import { RootState } from "../../util/types"
import { UrlObject, UrlWithStringQuery } from "url"

const fbAppId = process.env.FB_APP_ID

class SignIn extends React.Component<{
  dispatch: Function
  error: XMLHttpRequest
  authed: boolean
  pending?: boolean
  signInSuccessful?: boolean
  facebookError?: string
  location: UrlObject
}> {
  email: HTMLInputElement
  password: HTMLInputElement
  facebook_password: HTMLInputElement

  // eslint-disable-next-line node/handle-callback-err
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true }
  }

  componentDidMount() {
    this.props.dispatch({ type: "signin reset state" })
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.log(error, errorInfo)
  }

  handleLoginClicked(e) {
    e.preventDefault()
    const attrs = {
      email: this.email.value,
      password: this.password.value,
    }

    // var dest = this.getDest();
    // if (!dest.length) {
    //   dest = "/";
    // }
    this.props.dispatch(doSignin(attrs))
  }

  getDest() {
    return this.props.location.pathname.slice("/signin".length)
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
    let markup = <div></div>
    if (this.props.error) {
      markup = <div sx={{ color: "#d8403a" }}>{strings(this.props.error.responseText)}</div>
    }
    return markup
  }

  drawLoginForm() {
    return (
      <Box>
        <form>
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
              id="signinEmailInput"
              ref={(c) => (this.email = c)}
              placeholder="email"
              type="email"
              autoComplete="off"
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
              id="signinPasswordInput"
              ref={(c) => (this.password = c)}
              placeholder="password"
              type="password"
            />
          </Box>
          {this.maybeErrorMessage()}
          <Button
            sx={{ mt: [4], my: [2] }}
            id="signinButton"
            onClick={this.handleLoginClicked.bind(this)}
          >
            {this.props.pending ? "Signing in..." : "Sign In"}
          </Button>
          <Text sx={{ mt: 4 }}>
            {"Forgot your password? "}
            <Link sx={{ variant: "styles.a" }} to={"/pwresetinit"}>
              Reset Password
            </Link>
          </Text>
          <Text sx={{ mt: 2, mb: 4 }}>
            <Link sx={{ variant: "styles.a" }} to={"/createuser"}>
              Create User
            </Link>
          </Text>
        </form>
        {/*fbAppId && (
          <Box sx={{ my: 4 }}>
            <Button
              id="facebookSigninButton"
              onClick={this.facebookButtonClicked.bind(this)}>
              Sign in with Facebook
            </Button>
            <Text sx={{ my: 2 }}>
              If you click &apos;Sign in with Facebook&apos; and are not a
              user, you will be registered and you agree to the terms and
              privacy policy.
            </Text>
          </Box>
        )*/}
      </Box>
    )
  }

  drawPasswordConnectFacebookForm() {
    return (
      <span>
        <p>
          {"A user already exists with the email address associated with this Facebook account."}
        </p>
        <p>{"Please log into that user account to enable Facebook login."}</p>
        <input
          ref={(c) => (this.facebook_password = c)}
          placeholder="password"
          type="password"
          autoComplete="current-password"
        />
        <button onClick={this.handleFacebookPasswordSubmit.bind(this)}>
          {"Connect Facebook Account"}
        </button>
      </span>
    )
  }

  render() {
    const { signInSuccessful, authed } = this.props

    if (signInSuccessful || authed) {
      return <Redirect to={"/conversations"} />
    }

    return (
      <React.Fragment>
        <Heading as="h1" sx={{ my: [4, null, 5], fontSize: [6] }}>
          Sign In
        </Heading>
        {this.props.facebookError !== "polis_err_user_with_this_email_exists"
          ? this.drawLoginForm()
          : this.drawPasswordConnectFacebookForm()}
      </React.Fragment>
    )
  }
}

export default connect((state: RootState) => state.signin)(SignIn)
