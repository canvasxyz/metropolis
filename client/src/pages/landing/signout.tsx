import React from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { Heading } from "theme-ui"

import { doSignout } from "../../actions"
import { RootState } from "../../util/types"
import { AppDispatch } from "../../store"

class SignOut extends React.Component<{ dispatch: AppDispatch }, {}> {
  static propTypes: { dispatch: AppDispatch }

  componentDidMount() {
    this.props.dispatch(doSignout("/"))
  }

  render() {
    return (
      <>
        <Heading as="h1" sx={{ my: [4, null, 5], fontSize: [6] }}>
          Signing Out...
        </Heading>
        <p>Please wait a second to be signed out.</p>
      </>
    )
  }
}

SignOut.propTypes = {
  dispatch: PropTypes.func,
}

export default connect((state: RootState) => state.signout)(SignOut)
