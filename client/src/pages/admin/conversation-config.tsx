// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

/** @jsx jsx */

import React from "react"
import { connect } from "react-redux"
import { Heading, Box, Text, jsx } from "theme-ui"
import emoji from "react-easy-emoji"

import { handleZidMetadataUpdate, optimisticZidMetadataUpdateOnTyping } from "../../actions"
import NoPermission from "./no-permission"
import { CheckboxField } from "./CheckboxField"
import SeedComment from "./seed-comment"
// import SeedTweet from "./seed-tweet";

import Url from "../../util/url"
import ComponentHelpers from "../../util/component-helpers"
import { RootState } from "../../util/types"

class ConversationConfig extends React.Component<
  {
    dispatch: Function
    zid_metadata: { conversation_id: string; topic: string; description: string }
    error: string
    loading: boolean
  },
  {}
> {
  description: HTMLTextAreaElement
  topic: HTMLInputElement

  handleStringValueChange(field) {
    return () => {
      let val = this[field].value
      if (field === "help_bgcolor" || field === "help_color") {
        if (!val.length) {
          val = "default"
        }
      }
      this.props.dispatch(handleZidMetadataUpdate(this.props.zid_metadata, field, val))
    }
  }

  handleConfigInputTyping(field) {
    return (e) => {
      this.props.dispatch(
        optimisticZidMetadataUpdateOnTyping(this.props.zid_metadata, field, e.target.value)
      )
    }
  }

  render() {
    if (ComponentHelpers.shouldShowPermissionsError(this.props)) {
      return <NoPermission />
    }

    return (
      <Box>
        <Heading
          as="h3"
          sx={{
            fontSize: [3, null, 4],
            lineHeight: "body",
            mb: [3, null, 4],
          }}
        >
          Configure
        </Heading>
        <Box sx={{ mb: [4] }}>
          {this.props.loading ? (
            <Text>Saving...</Text>
          ) : (
            <Text>⚡ Changes automatically saved</Text>
          )}
          {this.props.error ? <Text>Error Saving</Text> : null}
        </Box>

        <CheckboxField field="is_active" label="Conversation is open">
          Uncheck to disable voting and commenting
        </CheckboxField>

        <Box sx={{ mb: [3] }}>
          <Text sx={{ mb: [2] }}>Topic</Text>
          <input
            ref={(c) => (this.topic = c)}
            sx={{
              fontFamily: "body",
              fontSize: [2],
              width: "100%",
              maxWidth: "35em",
              borderRadius: 2,
              padding: [2],
              border: "1px solid",
              borderColor: "mediumGray",
            }}
            data-test-id="topic"
            onBlur={this.handleStringValueChange("topic").bind(this)}
            onChange={this.handleConfigInputTyping("topic").bind(this)}
            defaultValue={this.props.zid_metadata.topic}
          />
        </Box>

        <Box sx={{ mb: [3] }}>
          <Text sx={{ mb: [2] }}>Description</Text>
          <textarea
            ref={(c) => (this.description = c)}
            sx={{
              fontFamily: "body",
              fontSize: [2],
              width: "100%",
              maxWidth: "35em",
              height: "7em",
              resize: "none",
              padding: [2],
              borderRadius: 2,
              border: "1px solid",
              borderColor: "mediumGray",
            }}
            data-test-id="description"
            onBlur={this.handleStringValueChange("description").bind(this)}
            onChange={this.handleConfigInputTyping("description").bind(this)}
            defaultValue={this.props.zid_metadata.description}
          />
        </Box>

        <Heading as="h3" sx={{ mt: 5, mb: 4 }}>
          Seed Comments
        </Heading>
        <SeedComment
          params={{ conversation_id: this.props.zid_metadata.conversation_id }}
          dispatch={this.props.dispatch}
        />
        {/* <SeedTweet params={{ conversation_id: this.props.zid_metadata.conversation_id }} /> */}

        <Heading as="h3" sx={{ mt: 5, mb: 4 }}>
          Customize the user interface
        </Heading>

        <CheckboxField field="vis_type" label="Visualization" isIntegerBool>
          Participants can see the visualization
        </CheckboxField>

        <CheckboxField field="write_type" label="Comment form" isIntegerBool>
          Participants can submit comments
        </CheckboxField>

        <CheckboxField field="help_type" label="Help text" isIntegerBool>
          Show explanation text above voting and visualization
        </CheckboxField>

        <CheckboxField
          field="subscribe_type"
          label="Prompt participants to subscribe to updates"
          isIntegerBool
        >
          Prompt participants to subscribe to updates. A prompt is shown to users once they finish
          voting on all available comments. If enabled, participants may optionally provide their
          email address to receive notifications when there are new comments to vote on.
        </CheckboxField>

        <CheckboxField field="auth_opt_fb" label="Facebook login prompt">
          Show Facebook login prompt
        </CheckboxField>

        <CheckboxField field="auth_opt_tw" label="Twitter login prompt">
          Show Twitter login prompt
        </CheckboxField>

        <Heading as="h3" sx={{ mt: 5, mb: 4 }}>
          Schemes
        </Heading>

        <CheckboxField field="strict_moderation">
          No comments shown without moderator approval
        </CheckboxField>

        <CheckboxField field="auth_needed_to_write" label="Require Auth to Comment">
          Participants cannot submit comments without first connecting either Facebook or Twitter
        </CheckboxField>

        <CheckboxField field="auth_needed_to_vote" label="Require Auth to Vote">
          Participants cannot vote without first connecting either Facebook or Twitter
        </CheckboxField>

        <Heading as="h3" sx={{ mt: 5, mb: 4 }}>
          Embed
        </Heading>
        <Box>
          <Text>Copy this HTML into your page to embed this survey.</Text>
          <Box
            sx={{ my: [2], px: [3], py: [1], border: "1px solid lightGray", borderRadius: "6px" }}
          >
            <pre>
              {"<div"}
              {" class='polis'"}
              {" data-conversation_id='" + this.props.zid_metadata.conversation_id + "'>"}
              {"</div>\n"}
              {"<script async src='" + Url.urlPrefix + "embed.js'></script>"}
            </pre>
          </Box>
          <Text>
            <a target="blank" href={Url.urlPrefix + "c/" + this.props.zid_metadata.conversation_id}>
              Open conversation
            </a>
          </Text>
        </Box>
      </Box>
    )
  }
}

export default connect((state: RootState) => state.user)(
  connect((state: RootState) => state.zid_metadata)(ConversationConfig)
)
