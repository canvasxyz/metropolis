/** @jsx jsx */

import { useCallback, useState, useEffect, ComponentProps } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { Link } from "react-router-dom"
import { Heading, Box, Text, jsx } from "theme-ui"
import toast from "react-hot-toast"

import { handleZidMetadataUpdate } from "../../actions"
import NoPermission from "./no-permission"
import { CheckboxField } from "./CheckboxField"
import SeedComment from "./seed-comment"

import api from "../../util/api"
import Url from "../../util/url"
import { RootState } from "../../util/types"

const FIP_REPO_OWNER = process.env.FIP_REPO_OWNER;
const FIP_REPO_NAME = process.env.FIP_REPO_NAME;

const Input = (props: ComponentProps<"input">) =>
  <input
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
    {...props}
  />

const Textarea = (props: ComponentProps<"textarea">) =>
  <textarea
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
    {...props}
  />

const ConversationConfig = ({ dispatch, zid_metadata, error }) => {
  // {
  //    const reportsPromise = api.get("/api/v3/reports", {
  //      conversation_id: this.props.conversation_id,
  //    })
  //    reportsPromise.then((reports) => {
  //      this.setState({
  //        loading: false,
  //        reports: reports,
  //      })
  //    })

  //                document.location = `/r/${conversation_id}/${this.state.reports[0].report_id}`


  const handleStringValueChange = useCallback(
    (field: string, element) => {
      dispatch(handleZidMetadataUpdate(zid_metadata, field, element.value))
    },
    [dispatch, handleZidMetadataUpdate, zid_metadata]
  )

  const handleIntegerValueChange = useCallback(
    (field: string, element) => {
      if (element.value === "") {
        dispatch(handleZidMetadataUpdate(zid_metadata, field, 0))
      } else {
        if (isNaN(element.value) || element.value.toString() !== element.value) {
          toast.error("Invalid value")
          return
        }
        dispatch(handleZidMetadataUpdate(zid_metadata, field, element.value))
      }
    },
    [dispatch, handleZidMetadataUpdate, zid_metadata]
  )

  const [reports, setReports] = useState()
  useEffect(() => {
    api
      .get("/api/v3/reports", {
        conversation_id: zid_metadata.conversation_id,
      })
      .then((reports) => {
        setReports(reports)
      })
  }, [])

  if (zid_metadata && !zid_metadata.is_owner && !zid_metadata.is_mod) {
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

      <Box sx={{ mb: [3] }}>
        PR <a href={`https://github.com/${FIP_REPO_OWNER}/${FIP_REPO_NAME}/pull/${zid_metadata.github_pr_id}`}>#{zid_metadata.github_pr_id}</a>
      </Box>

      <Box sx={{ mb: [3] }}>
        Branch <strong>{zid_metadata.github_branch_name}</strong> on <strong>{zid_metadata.github_repo_owner}/{zid_metadata.github_repo_name}</strong>
      </Box>

      <Box sx={{ mb: [3] }}>
        Submitted by <strong>{zid_metadata.github_pr_submitter}</strong>
      </Box>

      <Box sx={{ mb: [4] }}>{error ? <Text>Error Saving</Text> : null}</Box>

      <CheckboxField
        field="is_active"
        label="Conversation is open"
        subtitle="Uncheck to disable voting"
      />

      <Box sx={{ mt: [4], mb: [4] }}>
        <Link sx={{ variant: "styles.a" }} to={"/c/" + zid_metadata.conversation_id}>
          Go to survey
        </Link>
        {reports && reports[0] && (
          <Link
            sx={{ variant: "styles.a", ml: [3] }}
            to={"/r/" + zid_metadata.conversation_id + "/" + (reports[0] as any).report_id}
          >
            Go to report
          </Link>
        )}
      </Box>

      <Heading as="h3" sx={{ mt: 5, mb: 4 }}>
        GitHub Synced Data
      </Heading>

      <Box sx={{ mb: [4], fontStyle: "italic" }}>
        The fields in this section are automatically synced from GitHub. To change them, please
        modify the source pull request, or disable syncing by unchecking the box below.
      </Box>

      <CheckboxField
        field="github_sync_enabled"
        label="Enable GitHub sync"
        subtitle="Uncheck in order to disable syncing"
      />

      <Box sx={{ mb: [3] }}>
        <Text sx={{ mb: [2] }}>FIP title</Text>
        <Input
          onBlur={(e) => handleStringValueChange("fip_title", e.target)}
          defaultValue={zid_metadata.fip_title}
          disabled={zid_metadata.github_sync_enabled}
        />
      </Box>

      <Box sx={{ mb: [3] }}>
        <Text sx={{ mb: [2] }}>Description</Text>
        <Textarea
          data-test-id="description"
          onBlur={(e) => handleStringValueChange("description", e.target)}
          defaultValue={zid_metadata.description}
          disabled={zid_metadata.github_sync_enabled}
        />
      </Box>

      <Box sx={{ mb: [3] }}>
        <Text sx={{ mb: [2] }}>FIP author</Text>
        <Input
          onBlur={(e) => handleStringValueChange("fip_author", e.target)}
          defaultValue={zid_metadata.fip_author}
          disabled={zid_metadata.github_sync_enabled}
        />
      </Box>


      <Box sx={{ mb: [3] }}>
        <Text sx={{ mb: [2] }}>FIP discussions link</Text>
        <Input
          onBlur={(e) => handleStringValueChange("fip_discussions_to", e.target)}
          defaultValue={zid_metadata.fip_discussions_to}
          disabled={zid_metadata.github_sync_enabled}
        />
      </Box>

      <Box sx={{ mb: [3] }}>
        <Text sx={{ mb: [2] }}>FIP status</Text>
        <Input
          onBlur={(e) => handleStringValueChange("fip_status", e.target)}
          defaultValue={zid_metadata.fip_status}
          disabled={zid_metadata.github_sync_enabled}
        />
      </Box>

      <Box sx={{ mb: [3] }}>
        <Text sx={{ mb: [2] }}>FIP type</Text>
        <Input
          onBlur={(e) => handleStringValueChange("fip_type", e.target)}
          defaultValue={zid_metadata.fip_type}
          disabled={zid_metadata.github_sync_enabled}
        />
      </Box>

      <Box sx={{ mb: [3] }}>
        <Text sx={{ mb: [2] }}>FIP category</Text>
        <Input
          onBlur={(e) => handleStringValueChange("fip_category", e.target)}
          defaultValue={zid_metadata.fip_category}
          disabled={zid_metadata.github_sync_enabled}
        />
      </Box>

      <Box sx={{ mb: [3] }}>
        <Text sx={{ mb: [2] }}>FIP created</Text>
        <Input
          onBlur={(e) => handleStringValueChange("fip_created", e.target)}
          defaultValue={zid_metadata.fip_created}
          disabled={zid_metadata.github_sync_enabled}
        />
      </Box>

      <Heading as="h3" sx={{ mt: 5, mb: 4 }}>
        Post-Survey Redirect
      </Heading>

      <Box sx={{ mb: [4], fontStyle: "italic" }}>
        Once participants have reached the number of votes and submissions expected, they will be
        directed to the post-survey page.
      </Box>

      <Box sx={{ mb: [3] }}>
        <Text sx={{ mb: [2] }}>
          Votes Expected
          <Text sx={{ display: "inline", color: "lightGray", ml: [2] }}>Optional</Text>
        </Text>
        <Input
          onBlur={(e) => handleIntegerValueChange("postsurvey_limit", e.target)}
          defaultValue={zid_metadata.postsurvey_limit || ""}
        />
      </Box>

      <Box sx={{ mb: [3] }}>
        <Text sx={{ mb: [2] }}>
          Statements Expected
          <Text sx={{ display: "inline", color: "lightGray", ml: [2] }}>Optional</Text>
        </Text>
        <Input
          onBlur={(e) =>
            handleIntegerValueChange("postsurvey_submission", e.target)
          }
          defaultValue={zid_metadata.postsurvey_submissions || ""}
        />
      </Box>

      <Box sx={{ mb: [3] }}>
        <Text sx={{ mb: [2] }}>
          Post-Survey Text
          <Text sx={{ display: "inline", color: "lightGray", ml: [2] }}>Optional</Text>
        </Text>
        <textarea
          placeholder="You’re all done! Thanks for contributing your input. You can expect to hear back from us after..."
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
          onBlur={(e) => handleStringValueChange("postsurvey", e.target)}
          defaultValue={zid_metadata.postsurvey}
        />
      </Box>

      <Box sx={{ mb: [3] }}>
        <Text sx={{ mb: [2] }}>
          Post-Survey Link
          <Text sx={{ display: "inline", color: "lightGray", ml: [2] }}>
            Optional. Shown as a button after the survey
          </Text>
        </Text>
        <Input
          placeholder="https://"
          onBlur={(e) =>
            handleStringValueChange("postsurveyRedirect", e.target)
          }
          defaultValue={zid_metadata.postsurvey_redirect || ""}
        />
      </Box>

      <Heading as="h3" sx={{ mt: [6], mb: 4 }}>
        Permissions
      </Heading>

      <CheckboxField
        field="write_type"
        label="Enable comments"
        subtitle="Participants can write their own cards (Recommended: ON)"
        isIntegerBool
      />

      <CheckboxField
        field="auth_needed_to_write"
        label="Email required for responses"
        subtitle="Require an email to submit comments (Recommended: OFF)"
      />


      <CheckboxField
        field="strict_moderation"
        label="Moderation required for responses"
        subtitle="Require moderators to approve submitted comments before voters can see them"
      />

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
          sx={{
            mt: [2],
            mb: [3],
            px: [3],
            py: [1],
            border: "1px solid lightGray",
            borderRadius: "6px",
          }}
        >
          <pre style={{ fontSize: "14px" }}>
            {"<div"}
            {" class='polis'"}
            {" data-conversation_id='" + zid_metadata.conversation_id + "'>"}
            {"</div>\n"}
            {"<script async src='" + Url.urlPrefix + "embed.js'></script>"}
          </pre>
        </Box>

        <CheckboxField
          field="importance_enabled"
          label="Show importance on embeds"
          subtitle={`Show "This comment is important" checkbox on the embed interface`}
        />
      </Box>

      <Heading as="h3" sx={{ mt: 5, mb: 4 }}>
        Add seed comments
      </Heading>

      <SeedComment params={{ conversation_id: zid_metadata.conversation_id }} dispatch={dispatch} />

      <Box sx={{ mt: [4] }}>
        <Link sx={{ variant: "styles.a" }} to={"/c/" + zid_metadata.conversation_id}>
          Go to survey
        </Link>
        {reports && reports[0] && (
          <Link
            sx={{ variant: "styles.a", ml: [3] }}
            to={"/r/" + zid_metadata.conversation_id + "/" + (reports[0] as any).report_id}
          >
            Go to report
          </Link>
        )}
      </Box>
    </Box>
  )
}

ConversationConfig.propTypes = {
  dispatch: PropTypes.func,
  zid_metadata: PropTypes.shape({
    conversation_id: PropTypes.string,
    topic: PropTypes.string, // actually: title
    description: PropTypes.string, // actually: intro text
    survey_caption: PropTypes.string,
    postsurvey: PropTypes.string,
    postsurvey_limit: PropTypes.string,
    postsurvey_submissions: PropTypes.string,
    postsurvey_redirect: PropTypes.string,
    is_owner: PropTypes.bool,
    is_mod: PropTypes.bool
  }),
  error: PropTypes.string,
  loading: PropTypes.bool
}

export default connect((state: RootState) => state.user)(
  connect((state: RootState) => state.zid_metadata)(ConversationConfig)
)
