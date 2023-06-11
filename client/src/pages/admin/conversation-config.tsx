// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

/** @jsx jsx */

import React from "react"
import { connect } from "react-redux"
import { Link } from "react-router-dom"
import { Heading, Box, Text, jsx } from "theme-ui"
import toast from "react-hot-toast"

import { handleZidMetadataUpdate, optimisticZidMetadataUpdateOnTyping } from "../../actions"
import NoPermission from "./no-permission"
import { CheckboxField } from "./CheckboxField"
import SeedComment from "./seed-comment"

import Url from "../../util/url"
import ComponentHelpers from "../../util/component-helpers"
import { RootState } from "../../util/types"

class ConversationConfig extends React.Component<
  {
    dispatch: Function
    zid_metadata: {
      conversation_id: string
      topic: string
      description: string
      postsurvey: string
      postsurvey_limit: string
    }
    error: string
    loading: boolean
  },
  {}
> {
  topic: HTMLInputElement
  description: HTMLTextAreaElement
  postsurvey: HTMLTextAreaElement
  postsurvey_limit: HTMLInputElement

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

  handleIntegerValueChange(field) {
    return () => {
      const val = parseInt(this[field].value, 10)
      if (isNaN(val) || val.toString() !== this[field].value) {
        toast.error("Invalid value")
        return
      }
      this.props.dispatch(handleZidMetadataUpdate(this.props.zid_metadata, field, val))
    }
  }
  handleIntegerInputTyping(field) {
    return (e) => {
      const val = parseInt(e.target.value, 10)
      if (isNaN(val) || val.toString() !== this[field].value) {
        return
      }
      this.props.dispatch(optimisticZidMetadataUpdateOnTyping(this.props.zid_metadata, field, val))
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
          <Text sx={{ mb: [2] }}>Title</Text>
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
            onBlur={this.handleStringValueChange("topic").bind(this)}
            onChange={this.handleConfigInputTyping("topic").bind(this)}
            defaultValue={this.props.zid_metadata.topic}
          />
        </Box>

        <Box sx={{ mb: [3] }}>
          <Text sx={{ mb: [2] }}>Intro Text</Text>
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
          Post-Survey
        </Heading>

        <Box sx={{ mb: [3] }}>
          <Text sx={{ mb: [2] }}>
            Votes Required
            <Text sx={{ display: "inline", color: "lightGray", ml: [2] }}>
              Number of votes before the post-survey prompt
            </Text>
          </Text>
          <input
            ref={(c) => (this.postsurvey_limit = c)}
            placeholder="Recommended: 20-40"
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
            onBlur={this.handleIntegerValueChange("postsurvey_limit").bind(this)}
            onChange={this.handleIntegerInputTyping("postsurvey_limit").bind(this)}
            defaultValue={this.props.zid_metadata.postsurvey_limit}
          />
        </Box>

        <Box sx={{ mb: [3] }}>
          <Text sx={{ mb: [2] }}>Post-Survey Text</Text>
          <textarea
            ref={(c) => (this.postsurvey = c)}
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
            data-test-id="postsurvey"
            onBlur={this.handleStringValueChange("postsurvey").bind(this)}
            onChange={this.handleConfigInputTyping("postsurvey").bind(this)}
            defaultValue={this.props.zid_metadata.postsurvey}
          />
        </Box>

        <Heading as="h3" sx={{ mt: 5, mb: 4 }}>
          Customize the user interface
        </Heading>

        <CheckboxField field="write_type" label="Commenting" isIntegerBool>
          Participants can submit comments
        </CheckboxField>

        <CheckboxField field="strict_moderation" label="Strict mode (moderator approval required)">
          Require moderator approval before comments can be voted on
        </CheckboxField>

        <CheckboxField field="help_type" label="Help text" isIntegerBool>
          Show explanatory text when voting or writing comments
        </CheckboxField>

        {/*
        <CheckboxField
          field="subscribe_type"
          label="Prompt participants to subscribe to updates"
          isIntegerBool
        >
          Prompt participants after they have finished voting to provide their email address, to receive notifications when there are new comments to vote on.
        </CheckboxField>

        <CheckboxField field="auth_opt_fb" label="Facebook login prompt">
          Show Facebook login prompt
        </CheckboxField>

        <CheckboxField field="auth_opt_tw" label="Twitter login prompt">
          Show Twitter login prompt
        </CheckboxField>

        <CheckboxField field="auth_needed_to_write" label="Require Auth to Comment">
          Participants cannot submit comments without first connecting either Facebook or Twitter
        </CheckboxField>

        <CheckboxField field="auth_needed_to_vote" label="Require Auth to Vote">
          Participants cannot vote without first connecting either Facebook or Twitter
        </CheckboxField>
         */}

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
        </Box>

        <Heading as="h3" sx={{ mt: 5, mb: 4 }}>
          Add seed comments
        </Heading>

        <SeedComment
          params={{ conversation_id: this.props.zid_metadata.conversation_id }}
          dispatch={this.props.dispatch}
        />

        <Box sx={{ mt: [4] }}>
          <Link sx={{ variant: "styles.a" }} to={"/c/" + this.props.zid_metadata.conversation_id}>
            Go to survey
          </Link>
        </Box>
      </Box>
    )
  }
}

export default connect((state: RootState) => state.user)(
  connect((state: RootState) => state.zid_metadata)(ConversationConfig)
)
