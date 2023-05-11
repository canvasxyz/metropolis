// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

/** @jsx jsx */

import React from 'react'
import { connect } from 'react-redux'
import { handleSeedCommentSubmit, seedCommentChanged } from '../../../actions'
import strings from '../../../intl'
import { Box, Text, Button, jsx, Link } from 'theme-ui'
import { RootState } from '../../../util/types'

class ModerateCommentsSeed extends React.Component<{
  dispatch: Function
  params: { conversation_id: string }
  success: boolean
  loading?: boolean
  seedText: string
  error?: string
}> {
  seed_form: HTMLTextAreaElement

  constructor(props) {
    super(props)
    this.state = {
      showErrorDialogue: false,
      showSuccessDialogue: false
    }
  }

  handleSubmitSeed() {
    const comment = {
      txt: this.seed_form.value,
      pid: 'mypid',
      conversation_id: this.props.params.conversation_id,
      // vote: 0,
      is_seed: true
    }
    this.props.dispatch(handleSeedCommentSubmit(comment))
  }

  handleTextareaChange(e) {
    this.props.dispatch(seedCommentChanged(e.target.value))
  }

  getButtonText() {
    let text = 'Submit'

    if (this.props.success) {
      text = 'Success!'
    }

    if (this.props.loading) {
      text = 'Saving...'
    }

    return text
  }

  render() {
    const { seedText } = this.props
    return (
      <Box sx={{ mb: [4] }}>
        <Text sx={{ mb: [2] }}>
          Add starter comments for participants to vote on:
        </Text>
        <Box sx={{ mb: [2] }}>
          <textarea
            sx={{
              fontFamily: 'body',
              fontSize: [2],
              width: '35em',
              height: '7em',
              resize: 'none',
              padding: [2],
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'mediumGray'
            }}
            onChange={this.handleTextareaChange.bind(this)}
            maxLength={400}
            data-test-id="seed_form"
            value={seedText}
            ref={(c) => (this.seed_form = c)}
          />
        </Box>
        <Box>
          <Button onClick={this.handleSubmitSeed.bind(this)}>
            {this.getButtonText()}
          </Button>
          {this.props.error ? <Text>{strings(this.props.error)}</Text> : null}
        </Box>
      </Box>
    )
  }
}

export default connect((state: RootState) => state.seed_comments)(ModerateCommentsSeed)
