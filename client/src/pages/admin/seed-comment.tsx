// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

import React from "react"
import PropTypes from "prop-types"
import { populateAllCommentStores } from "../../actions"
import { Box, Text, Button, TextArea } from "@radix-ui/themes"
import api from "../../util/api"
import strings from "../../intl"
import { AppDispatch } from "../../store"

class ModerateCommentsSeed extends React.Component<
  {
    params: { conversation_id: string }
    dispatch: AppDispatch
  },
  {
    success?: boolean
    loading?: boolean
    error?: string
  }
> {
  static propTypes: object
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
        () => {
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
      <Box mb="4">
        <Box mb="2">
          <TextArea
            maxLength={400}
            data-test-id="seed_form"
            ref={(c) => (this.seed_form = c)}
            placeholder="One comment at a time"
          />
        </Box>
        <Box>
          <Button onClick={this.handleSubmitSeed.bind(this)}>
            {this.state.success ? "Success!" : this.state.loading ? "Saving..." : "Submit"}
          </Button>
          {this.state.error ? <Text mt="2" color="red">{this.state.error}</Text> : null}
        </Box>
      </Box>
    )
  }
}

ModerateCommentsSeed.propTypes = {
  conversation_id: PropTypes.string,
}

export default ModerateCommentsSeed
