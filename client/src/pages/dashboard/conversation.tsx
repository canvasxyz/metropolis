/** @jsx jsx */

import React, { useEffect, useState } from "react"
import { usePopper } from "react-popper"
import { toast } from "react-hot-toast"
import { Heading, Link, Box, Text, jsx } from "theme-ui"
import { Link as RouterLink, useHistory } from "react-router-dom"
import { useParams } from "react-router-dom-v5-compat"
import { TbExclamationCircle, TbInfoCircle } from "react-icons/tb"

import { RootState } from "../../store"
import { useAppSelector, useAppDispatch } from "../../hooks"
import { surveyBox } from "../survey"
import { populateZidMetadataStore } from "../../actions"
import { SentimentCheck } from "./sentiment_check"
import { SentimentCheckComments } from "./sentiment_check_comments"
import { Frontmatter, Collapsible } from "./front_matter"
import { incrementViewCount, useViewCount } from "../../reducers/view_counts"
import { MIN_SEED_RESPONSES } from "../../util/misc"
import ReportAndSurveyInfo from "./report_and_survey_info"

const dashboardBox = {
  bg: "bgWhite",
  py: "18px",
  px: "22px",
  my: [3],
  lineHeight: 1.35,
  border: "1px solid #ddd",
}

const SentimentTooltip = () => {
  const [referenceElement, setReferenceElement] = useState(null)
  const [popperElement, setPopperElement] = useState(null)
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    modifiers: [
      {
        name: "offset",
        enabled: true,
        options: {
          offset: [0, 6],
        },
      },
    ],
  })

  const [visible, setVisible] = useState(false)

  return (
    <Box>
      <Box
        ref={setReferenceElement}
        sx={{ ml: "6px" }}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        <TbInfoCircle />
      </Box>
      <div
        ref={setPopperElement}
        style={{
          background: "#fff",
          borderRadius: "4px",
          border: "1px solid #ddd",
          padding: "8px 14px 9px",
          maxWidth: "260px",
          zIndex: 10,
          fontWeight: 600,
          visibility: visible ? "visible" : "hidden",
          fontSize: "0.94em",
          ...styles.popper,
        }}
        {...attributes.popper}
      >
        A non-binding indication of your position on this FIP.
      </div>
    </Box>
  )
}

export const DashboardConversation = ({ user }: { user }) => {
  const { conversation_id: selectedConversationId } = useParams()
  const hist = useHistory()
  const dispatch = useAppDispatch()
  const { zid_metadata, error: zidMetadataError } = useAppSelector(
    (state: RootState) => state.zid_metadata,
  )

  const viewCount = useViewCount(zid_metadata.conversation_id)

  useEffect(() => {
    if (!zid_metadata.conversation_id) return
    dispatch(incrementViewCount(zid_metadata.conversation_id))
  }, [zid_metadata.conversation_id])

  useEffect(() => {
    dispatch(populateZidMetadataStore(selectedConversationId))
  }, [selectedConversationId])

  useEffect(() => {
    if (zidMetadataError) {
      toast.error("Couldn't retrieve conversation")
      // redirect to main dashboard
      hist.push(`/dashboard`)
    }
  }, [zidMetadataError])

  if (Object.keys(zid_metadata).length === 0) {
    return <Box>Loading...</Box>
  }

  const displayTitle = zid_metadata.fip_version
    ? zid_metadata.fip_version.fip_title
    : zid_metadata.topic

  return (
    <Box>
      <Box sx={{ mt: [6, "none"], width: "100%" }}>
        <Box
          sx={{
            flexDirection: "column",
            gap: [2],
            margin: "0 auto",
            pt: [5],
            pb: [2],
            mt: [3],
            px: [3, 5],
            maxWidth: "760px",
          }}
        >
          <Heading as="h2" sx={{ mb: [2] }}>
            {displayTitle}
          </Heading>
          {zid_metadata.fip_version?.github_pr?.submitter && (
            <Box>
              Created by{" "}
              <Link
                variant="links.a"
                as="a"
                target="_blank"
                rel="noreferrer"
                href={`https://github.com/${zid_metadata.fip_version.github_pr.submitter}`}
              >
                {zid_metadata.fip_version.github_pr.submitter}
              </Link>
              <Text> &middot; </Text>
              {(() => {
                const date = new Date(
                  zid_metadata.fip_version?.fip_created || +zid_metadata.created,
                )
                return date.toLocaleDateString("en-us", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
                // return `${date.getMonth() + 1}/${date.getUTCDate()}/${date.getFullYear()}`
              })()}
              <Text> &middot; </Text>
              {viewCount || "..."} views
              {zid_metadata.fip_version.github_pr.submitter === user?.githubUsername && (
                <Text>
                  <Text> &middot; </Text>
                  <RouterLink
                    sx={{ fontWeight: 600, "&:hover": { textDecoration: "underline" } }}
                    to={`/m/${zid_metadata?.conversation_id}`}
                  >
                    Edit
                  </RouterLink>
                </Text>
              )}
            </Box>
          )}
          {zid_metadata.fip_version ? (
            <Box sx={{ ...dashboardBox, px: "6px", pt: "10px", pb: "6px" }}>
              <Frontmatter zid_metadata={zid_metadata} />
            </Box>
          ) : (
            zid_metadata.description && (
              <Box sx={{ pt: "18px" }}>
                <Collapsible
                  title={displayTitle}
                  key={zid_metadata.conversation_id}
                  shouldCollapse={false}
                  content={zid_metadata.description}
                ></Collapsible>
              </Box>
            )
          )}
          {zid_metadata.fip_version && (
            <Box sx={dashboardBox}>
              <Box
                sx={{
                  display: "flex",
                  fontWeight: 700,
                  mb: [2],
                }}
              >
                Sentiment Check
                <SentimentTooltip />
              </Box>
              <SentimentCheck
                user={user}
                zid_metadata={zid_metadata}
                key={zid_metadata.conversation_id}
              />
            </Box>
          )}
          {!zid_metadata.fip_version &&
            !zid_metadata.is_archived &&
            zid_metadata?.comment_count < MIN_SEED_RESPONSES && (
              <Box
                sx={{
                  ...surveyBox,
                  p: "16px 18px",
                  my: [3],
                  borderLeft: "4px solid #eb4b4c",
                  lineHeight: 1.325,
                  bg: "bgWhite",
                }}
              >
                <Box sx={{ fontWeight: 600, mb: [1] }}>
                  <TbExclamationCircle /> Example Responses Required
                </Box>
                You should fill in at least {MIN_SEED_RESPONSES} example responses for readers to
                vote on. This poll will be hidden from other viewers until then.
              </Box>
            )}
          {!zid_metadata.fip_version && !zid_metadata.is_archived && (
            <ReportAndSurveyInfo conversation_info={zid_metadata} />
          )}
          {zid_metadata.fip_version && (
            <Box sx={dashboardBox}>
              <Box sx={{ fontWeight: "bold", pb: [1] }}>Comments</Box>
              {/* <Box sx={{ color: "mediumGray", pb: [1] }}>
                Have more to say? You can leave a short comment here.
                </Box> */}
              <Box sx={{ mx: "-8px", pt: "8px" }}>
                <SentimentCheckComments conversationId={zid_metadata.conversation_id} />
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
