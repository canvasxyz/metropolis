// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.
/** @jsx jsx */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { populateUserStore } from './actions'
import type { User } from './util/types'
import { RootState } from './util/types'


import _ from 'lodash'

import { Switch, Route, Link, Redirect } from 'react-router-dom'
import { Flex, Box, jsx } from 'theme-ui'

/* landing pages */
import Home from './pages/landing/home'
import TOS from './pages/landing/tos'
import Privacy from './pages/landing/privacy'
import PasswordReset from './pages/landing/password-reset'
import PasswordResetInit from './pages/landing/password-reset-init'
import PasswordResetInitDone from './pages/landing/password-reset-init-done'
import SignIn from './pages/landing/signin'
import SignOut from './pages/landing/signout'
import CreateUser from './pages/landing/createuser'

/* manage */
import Conversations from './pages/manage/conversations'
import ConversationIntegrate from './pages/manage/integrate'
import ConversationAdmin from './pages/manage/admin'
import Account from './pages/manage/account'

/* participate */
import Survey from './pages/survey'
import Logomark from './pages/widgets/logomark'

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
          <Redirect
            to={{ pathname: '/signin', state: { from: props.location } }}
          />
        )
      }
    />
  )
}

PrivateRoute.propTypes = {
  component: PropTypes.oneOfType([PropTypes.elementType, PropTypes.element]),
  isLoading: PropTypes.bool,
  location: PropTypes.object,
  authed: PropTypes.bool
}

class App extends React.Component<{
  dispatch: Function
  isLoggedIn: boolean,
  location: { pathname: string },
  user: User
  error: XMLHttpRequest
  status: number
}, {
  sidebarOpen: boolean
}> {
  static propTypes: {
    dispatch: Function,
    isLoggedIn: unknown
    location: object,
    user: object,
  }

  constructor(props) {
    super(props)
    this.state = {
      sidebarOpen: false
    }
  }

  loadUserData() {
    this.props.dispatch(populateUserStore())
  }

  UNSAFE_componentWillMount() {
    this.loadUserData()
  }

  isAuthed() {
    let authed = false

    if (!_.isUndefined(this.props.isLoggedIn) && this.props.isLoggedIn) {
      authed = true
    }

    if (
      (this.props.error && this.props.status === 401) ||
      this.props.status === 403
    ) {
      authed = false
    }

    return authed
  }

  isLoading() {
    const { isLoggedIn } = this.props

    return _.isUndefined(
      isLoggedIn
    ) /* if isLoggedIn is undefined, the app is loading */
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
          <Route exact path="/home" component={Home} />
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

          <Box>
            <Box
              sx={{
                width: '100%',
                backgroundColor: 'primary',
                color: 'background',
                zIndex: 1000,
                py: [3],
                px: [4],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
              <Link sx={{ variant: 'links.header' }} to="/">
                <Logomark
                  style={{ marginRight: 10, position: 'relative', top: 6 }}
                  fill={'white'}
                />
                Polis
              </Link>
              <Link id="signoutLink" sx={{ variant: 'links.header' }} to="/signout">
                sign out
              </Link>
            </Box>
            <Route
              render={(routeProps) => {
                if (routeProps.location.pathname.split('/')[1] === 'm') {
                  return null
                }
                return (
                  <Flex>
                    <Box sx={{ mr: [5], p: [4], flex: '0 0 auto' }}>
                      <Box sx={{ mb: [3] }}>
                        <Link sx={{ variant: 'links.nav' }} to={`/`}>
                          Conversations
                        </Link>
                      </Box>
                      <Box sx={{ mb: [3] }}>
                        <Link sx={{ variant: 'links.nav' }} to={`/integrate`}>
                          Integrate
                        </Link>
                      </Box>
                      <Box sx={{ mb: [3] }}>
                        <Link sx={{ variant: 'links.nav' }} to={`/account`}>
                          Account
                        </Link>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        p: [4],
                        flex: '0 0 auto',
                        maxWidth: '35em',
                        mx: [4]
                      }}>
                      <PrivateRoute
                        isLoading={this.isLoading()}
                        authed={this.isAuthed()}
                        exact
                        path="/"
                        component={Conversations}
                      />
                      <PrivateRoute
                        isLoading={this.isLoading()}
                        authed={this.isAuthed()}
                        exact
                        path="/conversations"
                        component={Conversations}
                      />
                      <PrivateRoute
                        isLoading={this.isLoading()}
                        authed={this.isAuthed()}
                        exact
                        path="/account"
                        component={Account}
                      />
                      <PrivateRoute
                        isLoading={this.isLoading()}
                        authed={this.isAuthed()}
                        exact
                        path="/integrate"
                        component={ConversationIntegrate}
                      />
                      <Route
                        path="/c/:conversation_id"
                        component={Survey}
                      />
                    </Box>
                  </Flex>
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
        </Switch>
      </React.Fragment>
    )
  }
}

App.propTypes = {
  dispatch: PropTypes.func,
  isLoggedIn: PropTypes.bool,
  location: PropTypes.shape({
    pathname: PropTypes.string
  }),
  user: PropTypes.shape({
    uid: PropTypes.string,
    email: PropTypes.string,
    created: PropTypes.number,
    hname: PropTypes.string
  })
}

export default connect((state: RootState) => state.user)(App)
