// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.
/** @jsx jsx */

import React from 'react'
import { connect } from 'react-redux'
import { doCreateUser, doFacebookSignin } from '../../actions'
import { Heading, Box, Text, Button, jsx } from 'theme-ui'

import { Link } from 'react-router-dom'
import StaticLayout from './lander-layout'
import strings from '../../intl'
import { RootState } from '../../util/types'
import { UrlObject } from 'url'

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
    return this.props.location.pathname.slice('/createuser'.length)
  }

  handleLoginClicked(e) {
    e.preventDefault()
    const attrs = {
      hname: this.hname.value,
      email: this.email.value,
      password: this.password.value,
      gatekeeperTosPrivacy: true
    }

    let dest = this.getDest()
    if (!dest.length) {
      dest = '/'
    }
    this.props.dispatch(doCreateUser(attrs, dest))
  }

  facebookButtonClicked() {
    let dest = this.getDest()
    if (!dest.length) {
      dest = '/'
    }
    this.props.dispatch(doFacebookSignin(dest))
  }

  handleFacebookPasswordSubmit() {
    let dest = this.getDest()
    if (!dest.length) {
      dest = '/'
    }
    const optionalPassword = this.facebook_password.value
    this.props.dispatch(doFacebookSignin(dest, optionalPassword))
  }

  maybeErrorMessage() {
    let markup = <React.Fragment/>
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
                fontFamily: 'body',
                fontSize: [2],
                width: '35em',
                borderRadius: 2,
                padding: [2],
                border: '1px solid',
                borderColor: 'mediumGray'
              }}
              id="createUserNameInput"
              ref={(c) => this.hname = c}
              placeholder="name"
              type="text"
            />
          </Box>
          <Box sx={{ my: [2] }}>
            <input
              sx={{
                fontFamily: 'body',
                fontSize: [2],
                width: '35em',
                borderRadius: 2,
                padding: [2],
                border: '1px solid',
                borderColor: 'mediumGray'
              }}
              id="createUserEmailInput"
              ref={(c) => this.email = c}
              placeholder="email"
              type="email"
            />
          </Box>
          <Box sx={{ my: [2] }}>
            <input
              sx={{
                fontFamily: 'body',
                fontSize: [2],
                width: '35em',
                borderRadius: 2,
                padding: [2],
                border: '1px solid',
                borderColor: 'mediumGray'
              }}
              id="createUserPasswordInput"
              ref={(c) => this.password = c}
              placeholder="password"
              type="password"
              autoComplete="new-password"
            />
          </Box>
          <Box sx={{ my: [2] }}>
            <input
              sx={{
                fontFamily: 'body',
                fontSize: [2],
                width: '35em',
                borderRadius: 2,
                padding: [2],
                border: '1px solid',
                borderColor: 'mediumGray'
              }}
              id="createUserPasswordRepeatInput"
              ref={(c) => this.password2 = c}
              placeholder="repeat password"
              type="password"
            />
          </Box>
          {this.maybeErrorMessage()}

          <Box sx={{ mt: [3], mb: [3] }}>
            I agree to the{' '}
            <a href="tos" tabIndex={110}>terms of service</a>{' '}
            and{' '}
            <a href="/privacy" tabIndex={111}>privacy policy</a>.
          </Box>
          <Button
            sx={{ my: [2] }}
            id="createUserButton"
            onClick={this.handleLoginClicked.bind(this)}>
            {this.props.pending ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
        <Box sx={{ mb: [4] }}>
          Already have an account?{' '}
          <Link
            tabIndex={6}
            to={'/signin' + this.getDest()}
            data-section="signup-select">
            Sign in
          </Link>
        </Box>

        {fbAppId && (
          <React.Fragment>
            <Button
              sx={{ my: [2] }}
              id="signupFacebookButton"
              onClick={this.facebookButtonClicked.bind(this)}>
              Sign up with Facebook
            </Button>
            <Text>
              If you click &apos;Sign in with Facebook&apos; and are not an existing
              user, you will be registered automatically.
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
          A user already exists with the email address associated with
          this Facebook account.
        </Text>
        <Text>
          {' '}
          Please log into that user account to enable Facebook
          login.
        </Text>
        <input
          ref={(c) => this.facebook_password = c}
          placeholder="password"
          type="password"
        />
        <Button onClick={this.handleFacebookPasswordSubmit.bind(this)}>
          {'Connect Facebook Account'}
        </Button>
      </Box>
    )
  }

  render() {
    return (
      <StaticLayout>
        <React.Fragment>
          <Heading as="h1" sx={{ my: [4, null, 5], fontSize: [6] }}>
            Create Account
          </Heading>
          {this.props.facebookError !== 'polis_err_user_with_this_email_exists'
            ? this.drawForm()
            : this.drawPasswordConnectFacebookForm()}
        </React.Fragment>
      </StaticLayout>
    )
  }
}

export default connect((state: RootState) => state.signin)(CreateUser)
