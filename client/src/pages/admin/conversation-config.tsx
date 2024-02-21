/** @jsx jsx */

import { useCallback, useState, useEffect, ComponentProps, Fragment } from "react"
import { Link as RouterLink } from "react-router-dom"
import { Heading, Box, Text, Link, Button, jsx } from "theme-ui"
import toast from "react-hot-toast"

import {
  handleZidMetadataUpdate,
  handleCloseConversation,
  handleReopenConversation,
} from "../../actions"
import NoPermission from "./no-permission"
import { CheckboxField } from "./CheckboxField"
import SeedComment from "./seed-comment"

import api from "../../util/api"
import Url from "../../util/url"
import { RootState } from "../../store"
import { useAppDispatch, useAppSelector } from "../../hooks"

const FIP_REPO_OWNER = process.env.FIP_REPO_OWNER
const FIP_REPO_NAME = process.env.FIP_REPO_NAME

const Input = (props: ComponentProps<"input">) => (
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
)

const Textarea = (props: ComponentProps<"textarea">) => (
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
)

type ConversationConfigProps = {
  error: string
  loading: boolean
}

const ConversationConfig = ({ error }: ConversationConfigProps) => {
  const [showFIPMetadata, setShowFIPMetadata] = useState(false)
  const { zid_metadata } = useAppSelector((state: RootState) => state.zid_metadata)
  const dispatch = useAppDispatch()

  const handleStringValueChange = useCallback(
    (field: string, element) => {
      dispatch(handleZidMetadataUpdate(zid_metadata, field, element.value))
    },
    [dispatch, handleZidMetadataUpdate, zid_metadata],
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
    [dispatch, handleZidMetadataUpdate, zid_metadata],
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
  }, [zid_metadata.conversation_id])

  if (zid_metadata && !zid_metadata.is_owner) {
    return <NoPermission />
  }

  const hasGithubPr = zid_metadata.github_pr_id !== null && zid_metadata.github_pr_id !== undefined

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

      <Box sx={{ mb: [4] }}>{error ? <Text>Error Saving</Text> : null}</Box>

      <CheckboxField
        field="is_active"
        label="Conversation is open"
        subtitle="Uncheck to disable voting"
      />

      <Box sx={{ my: [4] }}>
        <RouterLink to={"/dashboard/c/" + zid_metadata.conversation_id}>
          <Button sx={{ ml: [2] }} variant="outlineSecondary">
            Go to FIP dashboard
          </Button>
        </RouterLink>
        {!zid_metadata.github_pr_id && (
          <RouterLink to={"/c/" + zid_metadata.conversation_id}>
            <Button sx={{ ml: [2] }} variant="outlineSecondary">
              Go to survey
            </Button>
          </RouterLink>
        )}
        {reports && reports[0] && (
          <RouterLink to={`/r/${zid_metadata.conversation_id}/${(reports[0] as any).report_id}`}>
            <Button sx={{ ml: [2] }} variant="outlineSecondary">
              Go to report
            </Button>
          </RouterLink>
        )}
      </Box>

      <Box sx={{ mb: [3] }}>
        <Text sx={{ mb: [2] }}>Title</Text>
        <Input
          onBlur={(e) => handleStringValueChange("topic", e.target)}
          defaultValue={zid_metadata.topic}
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

      {zid_metadata.github_pr_id && (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            setShowFIPMetadata(!showFIPMetadata)
          }}
        >
          <Text variant="links.a" sx={{ mb: [2] }}>
            {showFIPMetadata ? "Hide" : "Show"} FIP Metadata
          </Text>
        </a>
      )}

      <Box
        sx={{
          border: "1px solid #ddd",
          px: [3],
          py: [3],
          display: showFIPMetadata ? "block" : "none",
        }}
      >
        {hasGithubPr && (
          <Fragment>
            <Heading as="h3" sx={{ mt: 0, mb: 4 }}>
              GitHub Synced Data
            </Heading>

            <Box sx={{ mb: [4], fontStyle: "italic" }}>
              The fields in this section are automatically synced from GitHub. To change them,
              please modify the source pull request, or disable syncing by unchecking the box below.
            </Box>

            <CheckboxField
              field="github_sync_enabled"
              label="Enable GitHub sync"
              subtitle="Uncheck in order to disable syncing"
            />
          </Fragment>
        )}

        {hasGithubPr && (
          <Fragment>
            <Box sx={{ mb: [3] }}>
              PR{" "}
              <a
                href={`https://github.com/${FIP_REPO_OWNER}/${FIP_REPO_NAME}/pull/${zid_metadata.github_pr_id}`}
              >
                #{zid_metadata.github_pr_id}
              </a>
            </Box>

            <Box sx={{ mb: [3] }}>
              Branch <strong>{zid_metadata.github_branch_name}</strong> on{" "}
              <strong>
                {zid_metadata.github_repo_owner}/{zid_metadata.github_repo_name}
              </strong>
            </Box>

            <Box sx={{ mb: [3] }}>
              Submitted by <strong>{zid_metadata.github_pr_submitter}</strong>
            </Box>
          </Fragment>
        )}

        <Box sx={{ mb: [3] }}>
          <Text sx={{ mb: [2] }}>FIP title</Text>
          <Input
            onBlur={(e) => handleStringValueChange("fip_title", e.target)}
            defaultValue={zid_metadata.fip_title}
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
          <Text sx={{ mb: [2] }}>FIP number</Text>
          <Input
            onBlur={(e) => handleStringValueChange("fip_number", e.target)}
            defaultValue={zid_metadata.fip_number}
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
      </Box>
      {/*
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
          onBlur={(e) => handleIntegerValueChange("postsurvey_submission", e.target)}
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
          onBlur={(e) => handleStringValueChange("postsurveyRedirect", e.target)}
          defaultValue={zid_metadata.postsurvey_redirect || ""}
        />
      </Box>
       */}

      <Heading as="h3" sx={{ mt: [6], mb: 4 }}>
        Permissions
      </Heading>

      <CheckboxField
        field="write_type"
        label="Enable user-submitted responses"
        subtitle="Recommended: ON"
        isIntegerBool
      />

      <CheckboxField
        field="auth_needed_to_write"
        label="Login required to submit responses"
        subtitle="Recommended: ON"
      />

      <CheckboxField
        field="strict_moderation"
        label="Moderator approval required for responses"
        subtitle="Moderators must approve responses before they are displayed (Recommended: OFF)"
      />

      {/*
        <CheckboxField
          field="subscribe_type"
          label="Prompt participants to subscribe to updates"
          isIntegerBool
        >
          Prompt participants after they have finished voting to provide their email address, to receive notifications when there are new comments to vote on.
        </CheckboxField>
          */}

      {/*
      <Heading as="h3" sx={{ mt: 5, mb: 4 }}>
        Embed
      </Heading>
      <Box>
        <Text>Copy this HTML into your page to embed this survey.</Text>
        <pre style={{ fontSize: "14px" }}>
          {"<div"}
          {" class='polis'"}
          {" data-conversation_id='" + zid_metadata.conversation_id + "'>"}
          {"</div>"}
          {"<script async src='" + Url.urlPrefix + "embed.js'></script>"}
        </pre>

        {/*
        <CheckboxField
          field="importance_enabled"
          label="Show importance on embeds"
          subtitle={`Show "This comment is important" checkbox on the embed interface`}
        />
      </Box>
     */}

      {/*
      <Heading as="h3" sx={{ mt: 5, mb: 4 }}>
        Add seed comments
      </Heading>

      <SeedComment params={{ conversation_id: zid_metadata.conversation_id }} dispatch={dispatch} />*/}
    </Box>
  )
}

export default ConversationConfig
