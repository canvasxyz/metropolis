/** @jsx jsx */

import React from "react"
import { ConnectedProps, connect } from "react-redux"
import { doSignin } from "../../actions"
import { Link, Redirect } from "react-router-dom"
import { Heading, Box, Text, Button, jsx } from "theme-ui"

import strings from "../../intl"
import { UrlObject } from "url"
import { AppDispatch, RootState } from "../../store"

const connector = connect((state: RootState) => state.signin)
type PropsFromRedux = ConnectedProps<typeof connector>
type CreateUserProps = PropsFromRedux & {
  location: UrlObject
  dispatch: AppDispatch
  pending: boolean
  authed: boolean
  signInSuccessful: boolean
}

class SignIn extends React.Component<CreateUserProps> {
  email: HTMLInputElement
  password: HTMLInputElement

  // eslint-disable-next-line node/handle-callback-err
  static getDerivedStateFromError() {
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
                width: "100%",
                maxWidth: "35em",
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
                width: "100%",
                maxWidth: "35em",
                borderRadius: 2,
                padding: [2],
                border: "1px solid",
                borderColor: "mediumGray",
              }}
              id="signinPasswordInput"
              ref={(c) => (this.password = c)}
              placeholder="password"
              type="password"
              autoComplete="password"
            />
          </Box>
          {this.maybeErrorMessage()}
          <Button
            sx={{ mt: [4], my: [2], px: [4] }}
            id="signinButton"
            onClick={this.handleLoginClicked.bind(this)}
            variant="buttons.disabled"
            disabled
          >
            {this.props.pending ? "Signing in..." : "Sign in"}
          </Button>
          <Text sx={{ mt: 4 }}>
            {"Forgot your password? "}
            <Link sx={{ variant: "styles.a" }} to={"/pwresetinit"}>
              Reset Password
            </Link>
          </Text>
          <Text sx={{ mt: 2, mb: 4 }}>
            <Link sx={{ variant: "styles.a" }} to={"/createuser"}>
              Create Account
            </Link>
          </Text>
        </form>
      </Box>
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
        {this.drawLoginForm()}
      </React.Fragment>
    )
  }
}

export default connector(SignIn)
