/** @jsx jsx */

import "./types.d.ts"

import React from "react"
import PropTypes from "prop-types"
import { ConnectedProps, connect } from "react-redux"
import { populateUserStore } from "./actions"

import { Toaster } from "react-hot-toast"
import { Switch, Route, Redirect } from "react-router-dom"
import { Box, jsx } from "theme-ui"

import Header from "./components/header"
import Footer from "./components/footer"

/* public home page */
import Home from "./pages/home"
import About from "./pages/about"
import Dashboard from "./pages/dashboard"

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
import CreateConversation from "./pages/create_conversation"
import ConversationAdmin from "./pages/admin"
import Account from "./pages/account"
import SurveyWithLoader from "./pages/survey/survey_with_loader"
import { Placeholder } from "./pages/dashboard/placeholder"
import { DashboardConversation } from "./pages/dashboard/conversation"
import { SentimentChecks } from "./pages/dashboard/sentiment_checks"
import { FipTracker } from "./pages/dashboard/fip_tracker"

/* report */
import Report from "./pages/report"
import { AppDispatch, RootState } from "./store"

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

const connector = connect((state: RootState) => state.user)
type PropsFromRedux = ConnectedProps<typeof connector>

type AppPropTypes = PropsFromRedux & {
  dispatch: AppDispatch
  location: { pathname: string }
  pending?: boolean
  status?: number
}

class App extends React.Component<
  AppPropTypes,
  {
    sidebarOpen: boolean
  }
> {
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
    const inHomepage = document.location.pathname === "/about"
    const inDashboard =
      document.location.pathname.startsWith("/dashboard") || document.location.pathname === "/"

    return (
      <React.Fragment>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 5000,
          }}
        />
        <Switch>
          <Redirect from="/:url*(/+)" to={location.pathname.slice(0, -1)} />
        </Switch>
        <Box>
          <Box
            sx={{
              margin: `0 auto`,
              maxWidth: inDashboard ? "none" : inHomepage ? "62em" : inReport ? "62em" : "48em",
              pb: inDashboard ? [0] : [4],
            }}
          >
            {document.location.pathname !== "/about" &&
              document.location.pathname !== "/" &&
              !document.location.pathname.startsWith("/dashboard") && (
                <Header isLoggedIn={this.props.isLoggedIn} inSurvey={inSurvey} />
              )}
            <Box
              sx={{
                pt: "1px", // prevent margins from spilling over
                pb: inDashboard ? 0 : "1em",
                px: inDashboard ? 0 : [4, 5],
                minHeight: "calc(100vh - 9em - 8px)",
              }}
            >
              <Route
                exact
                path="/"
                render={() => (
                  <Dashboard user={this.props.user}>
                    <Placeholder />
                  </Dashboard>
                )}
              />
              <Route
                exact
                path="/dashboard"
                render={() => (
                  <Dashboard user={this.props.user}>
                    <Placeholder />
                  </Dashboard>
                )}
              />
              <Route
                exact
                path="/dashboard/sentiment_checks"
                render={() => (
                  <Dashboard user={this.props.user}>
                    <SentimentChecks />
                  </Dashboard>
                )}
              />
              <Route
                exact
                path="/dashboard/fip_tracker"
                render={() => (
                  <Dashboard user={this.props.user}>
                    <FipTracker user={this.props.user} />
                  </Dashboard>
                )}
              />
              <Route
                path="/dashboard/c/:conversation_id"
                render={({
                  match: {
                    params: { conversation_id },
                  },
                }) => (
                  <Dashboard user={this.props.user}>
                    <DashboardConversation
                      selectedConversationId={conversation_id}
                      user={this.props.user}
                    />
                  </Dashboard>
                )}
              />
              <Route exact path="/about" render={() => <Home user={this.props.user} />} />
              <Route exact path="/about2" render={() => <About />} />
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
                      <Route exact path="/create" component={CreateConversation} />
                      <PrivateRoute
                        isLoading={this.isLoading()}
                        authed={this.isAuthed()}
                        exact
                        path="/account"
                        component={Account}
                      />
                      <Route path="/c/:conversation_id" component={SurveyWithLoader} />
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
            {document.location.pathname !== "/" &&
              !document.location.pathname.startsWith("/dashboard") && (
                <Footer inSurvey={inSurvey} />
              )}
          </Box>
          <Box
            sx={{
              position: "fixed",
              width: "100%",
              bottom: 0,
              height: "150px",
              opacity: 0.15,
              transform: "scaleY(-1)",
              zIndex: -1,
              backgroundImage:
                "linear-gradient(180deg, #CEC3AB 0%, #D4CAB4 8%, #D9D0BC 15%, #DED6C3 23%, #E3DBCA 29%, #E7E0D0 36%, #EBE4D5 42%, #EEE8DA 48%, #F1EBDE 54%, #F4EEE2 61%, #F6F1E5 68%, #F8F2E7 75%, #F9F4E9 83%, #FAF5EA 91%, #FAF5EA 100%);",
            }}
          ></Box>
        </Box>
      </React.Fragment>
    )
  }
}

export default connector(App)
