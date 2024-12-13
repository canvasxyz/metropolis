import React from "react"
import { ConnectedProps, connect } from "react-redux"
import { doCreateUser } from "../../actions"
import { Box, Button, Flex, Heading, Text, TextField } from "@radix-ui/themes"

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
      markup = <Text color="red">{strings(this.props.error.responseText)}</Text>
    }
    return markup
  }

  drawForm() {
    return (
      <Box>
        <Box mb="4" maxWidth="400px">
          <form>
            <Flex direction="column" gap="2">
              <TextField.Root
                ref={(c) => (this.hname = c)}
                placeholder="name"
                autoComplete="name"
              />
              <TextField.Root
                ref={(c) => (this.email = c)}
                placeholder="email"
                type="email"
                autoComplete="username"
              />
              <TextField.Root
                ref={(c) => (this.password = c)}
                placeholder="password"
                type="password"
                autoComplete="new-password"
              />
              <TextField.Root
                ref={(c) => (this.password2 = c)}
                placeholder="repeatpassword"
                type="password"
                autoComplete="new-password"
              />
            </Flex>
            {this.maybeErrorMessage()}

            <Box mt="3" mb="3">
              By signing up, you agree to the{" "}
              <Link to="/tos" tabIndex={110}>
                terms of service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" tabIndex={111}>
                privacy policy
              </Link>
              .
            </Box>
            <Button
              id="createUserButton"
              onClick={this.handleLoginClicked.bind(this)}
              size="3"
              disabled
            >
              {this.props.pending ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </Box>
        <Box mb="4">
          Already have an account?{" "}
          <Link
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
        <Heading as="h1" my={{initial: "4", md: "5"}} size="6">
          Create Account
        </Heading>
        {this.drawForm()}
      </React.Fragment>
    )
  }
}

export default connector(CreateUser)
