import React from "react"
import PropTypes from "prop-types"
import { ConnectedProps, connect } from "react-redux"
import { Box, Heading } from "theme-ui"

import { User } from "../util/types"
import Spinner from "../components/spinner"
import { RootState } from "../store"

const connector = connect((state: RootState) => state.user)
type PropsFromRedux = ConnectedProps<typeof connector>

class Account extends React.Component<PropsFromRedux> {
  static propTypes: {
    user: object
  }

  buildAccountMarkup() {
    return (
      <Box>
        <Heading
          as="h1"
          sx={{
            fontSize: [5],
            lineHeight: 1.2,
            mt: [2, null, 5],
            mb: [4, null, 5],
          }}
        >
          Account
        </Heading>
        <p>Hi {this.props.user.hname.split(" ")[0]}!</p>
        <Box>
          <p>Name: {this.props.user.hname}</p>
          <p>Email: {this.props.user.email || "--"}</p>
          <p>
            Social:{" "}
            {!this.props.user.hasFacebook && !this.props.user.hasTwitter
              ? "No social accounts connected"
              : ""}
          </p>
          <p>
            {this.props.user.hasFacebook ? <p>Facebook is connected</p> : ""}
            {this.props.user.hasTwitter ? <p>Twitter is connected</p> : ""}
          </p>
        </Box>
      </Box>
    )
  }

  render() {
    return <div>{this.props.user.hname ? this.buildAccountMarkup() : <Spinner />}</div>
  }
}

Account.propTypes = {
  user: PropTypes.shape({
    hname: PropTypes.string,
    email: PropTypes.string,
    hasFacebook: PropTypes.bool,
    hasTwitter: PropTypes.bool,
  }),
}

export default connector(Account)
