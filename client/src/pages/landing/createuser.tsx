/** @jsx jsx */

import React from "react"
import { ConnectedProps, connect } from "react-redux"
import { doCreateUser } from "../../actions"
import { Heading, Box, Button, jsx } from "theme-ui"

import { Link } from "react-router-dom"
import strings from "../../intl"
import { UrlObject } from "url"
import { AppDispatch, RootState } from "../../store"

const connector = connect((state: RootState) => state.signin)
type PropsFromRedux = ConnectedProps<typeof connector>
type CreateUserProps = PropsFromRedux & {
  location: UrlObject
  dispatch: AppDispatch
  pending: boolean
}

class CreateUser extends React.Component<CreateUserProps> {
  hname: HTMLInputElement
  email: HTMLInputElement
  password: HTMLInputElement
  password2: HTMLInputElement

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
                width: "100%",
                maxWidth: "35em",
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
                width: "100%",
                maxWidth: "35em",
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
                width: "100%",
                maxWidth: "35em",
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
                width: "100%",
                maxWidth: "35em",
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
            By signing up, you agree to the{" "}
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
            sx={{ my: [2], px: [4] }}
            id="createUserButton"
            onClick={this.handleLoginClicked.bind(this)}
            variant="buttons.disabled"
            disabled
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
      </Box>
    )
  }

  render() {
    return (
      <React.Fragment>
        <Heading as="h1" sx={{ my: [4, null, 5], fontSize: [6] }}>
          Create Account
        </Heading>
        {this.drawForm()}
      </React.Fragment>
    )
  }
}

export default connector(CreateUser)
