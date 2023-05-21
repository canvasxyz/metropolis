/** @jsx jsx */

import React from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { populateUserStore } from "./actions"
import type { User } from "./util/types"
import { RootState } from "./util/types"

import _ from "lodash"

import { Switch, Route, Link, Redirect } from "react-router-dom"
import { Flex, Box, jsx } from "theme-ui"

import Header from "./components/header"
import Footer from "./components/footer"
import Logomark from "./components/logomark"

/* public home page */
import Home from "./pages/home"

/* landing pages */
import TOS from "./pages/landing/tos"
import Privacy from "./pages/landing/privacy"
import PasswordReset from "./pages/landing/password-reset"
import PasswordResetInit from "./pages/landing/password-reset-init"
import PasswordResetInitDone from "./pages/landing/password-reset-init-done"
import SignIn from "./pages/landing/signin"
import SignOut from "./pages/landing/signout"
import CreateUser from "./pages/landing/createuser"

/* conversations */
import AllConversations from "./pages/all_conversations"
import ConversationAdmin from "./pages/admin"
import Account from "./pages/account"
import Survey from "./pages/survey"

const PrivateRoute = ({ component: Component, isLoading, authed, ...rest }) => {
  if (isLoading) {
    return null
  }
  return (
    <Route
      {...rest}
      render={(props) =>
        authed === true ? (
          <Component {...props} />
        ) : (
          <Redirect to={{ pathname: "/signin", state: { from: props.location } }} />
        )
      }
    />
  )
}

PrivateRoute.propTypes = {
  component: PropTypes.oneOfType([PropTypes.elementType, PropTypes.element]),
  isLoading: PropTypes.bool,
  location: PropTypes.object,
  authed: PropTypes.bool,
}

class App extends React.Component<
  {
    dispatch: Function
    isLoggedIn: boolean
    location: { pathname: string }
    user: User
    error: XMLHttpRequest
    status: number
  },
  {
    sidebarOpen: boolean
  }
> {
  static propTypes: {
    dispatch: Function
    isLoggedIn: unknown
    location: object
    user: object
  }

  constructor(props) {
    super(props)
    this.state = {
      sidebarOpen: false,
    }
  }

  UNSAFE_componentWillMount() {
    this.props.dispatch(populateUserStore())
  }

  isAuthed() {
    let authed = false

    if (this.props.isLoggedIn) {
      authed = true
    }

    if (
      this.props.error &&
      this.props.status === 401
      // || this.props.status === 403
    ) {
      authed = false
    }

    return authed
  }

  isLoading() {
    const { isLoggedIn } = this.props

    return _.isUndefined(isLoggedIn) /* if isLoggedIn is undefined, the app is loading */
  }

  onSetSidebarOpen(open) {
    this.setState({ sidebarOpen: open })
  }

  handleMenuButtonClick() {
    this.setState({ sidebarOpen: !this.state.sidebarOpen })
  }

  render() {
    const { location } = this.props
    return (
      <React.Fragment>
        <Switch>
          <Redirect from="/:url*(/+)" to={location.pathname.slice(0, -1)} />
          <Box
            sx={{
              margin: `0 auto`,
              maxWidth: "45em",
              padding: `0 1.0875rem 1.45rem`,
            }}
          >
            <Header user={this.props.user} />
            <Box
              sx={{
                pt: "1px", // prevent margins from spilling over
                pb: "1em",
                minHeight: "calc(100vh - 10.2em)",
              }}
            >
              <Route exact path="/" render={() => <Home user={this.props.user} />} />
              <Route
                exact
                path="/signin"
                render={() => <SignIn {...this.props} authed={this.isAuthed()} />}
              />
              <Route
                exact
                path="/signin/*"
                render={() => <SignIn {...this.props} authed={this.isAuthed()} />}
              />
              <Route
                exact
                path="/signin/**/*"
                render={() => <SignIn {...this.props} authed={this.isAuthed()} />}
              />
              <Route exact path="/signout" component={SignOut} />
              <Route exact path="/signout/*" component={SignOut} />
              <Route exact path="/signout/**/*" component={SignOut} />
              <Route exact path="/createuser" component={CreateUser} />
              <Route exact path="/createuser/*" component={CreateUser} />
              <Route exact path="/createuser/**/*" component={CreateUser} />

              <Route exact path="/pwreset" component={PasswordReset} />
              <Route path="/pwreset/*" component={PasswordReset} />
              <Route exact path="/pwresetinit" component={PasswordResetInit} />

              <Route exact path="/pwresetinit/done" component={PasswordResetInitDone} />
              <Route exact path="/tos" component={TOS} />
              <Route exact path="/privacy" component={Privacy} />

              <Route
                render={(routeProps) => {
                  if (routeProps.location.pathname.split("/")[1] === "m") {
                    return null
                  }
                  return (
                    <Box>
                      <PrivateRoute
                        isLoading={this.isLoading()}
                        authed={this.isAuthed()}
                        exact
                        path="/conversations"
                        component={AllConversations}
                      />
                      <PrivateRoute
                        isLoading={this.isLoading()}
                        authed={this.isAuthed()}
                        exact
                        path="/account"
                        component={Account}
                      />
                      <Route path="/c/:conversation_id" component={Survey} />
                    </Box>
                  )
                }}
              />
              <PrivateRoute
                authed={this.isAuthed()}
                isLoading={this.isLoading()}
                path="/m/:conversation_id"
                component={ConversationAdmin}
              />
            </Box>
            <Footer />
          </Box>
        </Switch>
      </React.Fragment>
    )
  }
}

App.propTypes = {
  dispatch: PropTypes.func,
  isLoggedIn: PropTypes.bool,
  location: PropTypes.shape({
    pathname: PropTypes.string,
  }),
  user: PropTypes.shape({
    uid: PropTypes.number,
    email: PropTypes.string,
    created: PropTypes.number,
    hname: PropTypes.string,
  }),
}

export default connect((state: RootState) => state.user)(App)
