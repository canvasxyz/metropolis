// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { doPasswordReset } from '../../actions'
import StaticLayout from './lander-layout'
import { UrlObject } from 'url'

class PasswordReset extends React.Component<{ dispatch: Function, location: UrlObject }, {
  passwordRepeat: HTMLInputElement
  password: HTMLInputElement
}> {
  static propTypes: { dispatch: Function, location: object }

  handleClick(e) {
    e.preventDefault()
    const attrs = {
      newPassword: this.state.password.value,
      pwresettoken: this.props.location.pathname.slice('/pwreset/'.length)
    }

    if (attrs.newPassword !== this.state.passwordRepeat.value) {
      alert('Passwords need to match')
      return
    }

    this.props.dispatch(doPasswordReset(attrs))
  }

  render() {
    return (
      <StaticLayout>
        <React.Fragment>
          <h1>Password Reset</h1>
          <form>
            <input
              ref={(c) => (this.setState({ password: c }))}
              placeholder="new password"
              type="password"
            />
            <input
              ref={(c) => (this.setState({ passwordRepeat: c }))}
              placeholder="repeat new password"
              type="password"
            />
            <button onClick={this.handleClick.bind(this)}>
              Set new password
            </button>
          </form>
        </React.Fragment>
      </StaticLayout>
    )
  }
}

PasswordReset.propTypes = {
  dispatch: PropTypes.func,
  location: PropTypes.object
}

export default connect()(PasswordReset)
