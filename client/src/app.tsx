/** @jsx jsx */

import React from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { populateUserStore } from "./actions"
import type { User } from "./util/types"
import { RootState } from "./util/types"

import { Toaster } from "react-hot-toast"
import { Switch, Route, Link, Redirect } from "react-router-dom"
import { Flex, Box, jsx } from "theme-ui"

import Header from "./components/header"
import Footer from "./components/footer"
import Logomark from "./components/logomark"

/* public home page */
import Home from "./pages/home"
import About from "./pages/about"

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

/* report */
import Report from "./pages/report"

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
    return isLoggedIn === undefined
  }

  onSetSidebarOpen(open) {
    this.setState({ sidebarOpen: open })
  }

  handleMenuButtonClick() {
    this.setState({ sidebarOpen: !this.state.sidebarOpen })
  }

  render() {
    const { location } = this.props
    const inReport = document.location.pathname?.startsWith("/r/")
    const inSurvey = document.location.pathname?.startsWith("/c/")

    return (
      <React.Fragment>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 5000,
            style: {
              fontFamily: "Space Grotesk, monospace",
            },
          }}
        />
        <Switch>
          <Redirect from="/:url*(/+)" to={location.pathname.slice(0, -1)} />
          <Box
            sx={{
              margin: `0 auto`,
              maxWidth: inReport ? "62em" : "45em",
              pb: [4],
            }}
          >
            <Header isLoggedIn={this.props.isLoggedIn} user={this.props.user} inSurvey={inSurvey} />
            <Box
              sx={{
                pt: "1px", // prevent margins from spilling over
                pb: "1em",
                px: [4],
                minHeight: "calc(100vh - 9em)",
              }}
            >
              <Route exact path="/" render={() => <Home user={this.props.user} />} />
              <Route exact path="/about" render={() => <About />} />
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
                      <Route path="/r/:conversation_id/:report_id" component={Report} />
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
            <Footer inSurvey={inSurvey} />
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
