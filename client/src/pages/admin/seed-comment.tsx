// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

/** @jsx jsx */

import React from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { populateAllCommentStores } from "../../actions"
import { Box, Text, Button, jsx } from "theme-ui"
import { RootState } from "../../util/types"
import api from "../../util/api"
import strings from "../../intl"

class ModerateCommentsSeed extends React.Component<
  {
    params: { conversation_id: string }
    dispatch: Function
  },
  {
    success?: boolean
    loading?: boolean
    error?: string
  }
> {
  static propTypes: {}
  seed_form: HTMLTextAreaElement

  constructor(props) {
    super(props)
    this.state = {}
  }

  handleSubmitSeed() {
    const comment = {
      txt: this.seed_form.value,
      pid: "mypid",
      conversation_id: this.props.params.conversation_id,
      // vote: 0,
      is_seed: true,
    }
    api
      .post("/api/v3/comments", comment)
      .then(
        (res) => {
          const { tid, currentPid } = res
          this.seed_form.value = ""
          this.setState({ ...this.state, success: true })
          setTimeout(() => this.setState({ ...this.state, success: false }), 1000)
        },
        (err) => {
          const error = strings(err.responseText)
          this.setState({ ...this.state, error })
        }
      )
      .then(this.props.dispatch(populateAllCommentStores(comment.conversation_id)))
  }

  render() {
    return (
      <Box sx={{ mb: [4] }}>
        <Box sx={{ mb: [2] }}>
          <textarea
            sx={{
              fontFamily: "body",
              fontSize: [2],
              width: "100%",
              maxWidth: "35em",
              height: "4em",
              resize: "none",
              padding: [2],
              borderRadius: 2,
              border: "1px solid",
              borderColor: "mediumGray",
            }}
            maxLength={400}
            data-test-id="seed_form"
            ref={(c) => (this.seed_form = c)}
            placeholder="One comment at a time"
          />
        </Box>
        <Box>
          <Button variant="outline" onClick={this.handleSubmitSeed.bind(this)}>
            {this.state.success ? "Success!" : this.state.loading ? "Saving..." : "Submit"}
          </Button>
          {this.state.error ? <Text sx={{ mt: [2], color: "red" }}>{this.state.error}</Text> : null}
        </Box>
      </Box>
    )
  }
}

ModerateCommentsSeed.propTypes = {
  conversation_id: PropTypes.string,
}

export default ModerateCommentsSeed
