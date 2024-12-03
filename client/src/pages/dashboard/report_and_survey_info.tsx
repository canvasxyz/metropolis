import React, { useCallback, useMemo, useState } from "react"
import { Link, Box, Text, Button } from "theme-ui"
import Survey, { surveyBox } from "../survey"
import api from "../../util/api"
import { FipVersion } from "../../util/types"
import { ReportComment, ReportCommentRow } from "./report_comment"
import { Link as RouterLink } from "react-router-dom"
import useSWR from "swr"

const dashboardBox = {
  bg: "bgWhite",
  py: "18px",
  px: "22px",
  my: [3],
  lineHeight: 1.35,
  border: "1px solid #ddd",
}

type ReportAndSurveyInfoProps = {
  // this type should match both ZidMetadata and ConversationSummary
  conversation_info: {
    conversation_id: string
    fip_version: FipVersion
    help_type: number
    postsurvey: string
    postsurvey_limit: string
    postsurvey_redirect: string
    auth_needed_to_write: boolean
  }
}

const ReportAndSurveyInfo = ({
  conversation_info,
}: ReportAndSurveyInfoProps) => {

  const {
    data: reports,
    mutate: mutateReport,
    isLoading: isReportLoading,
  } = useSWR(conversation_info.conversation_id, async (id) =>
    await api.get(`/api/v3/reports`, { conversation_id: id })
  )

  const report = (reports || [])[0]

  const {
    data: reportComments,
    mutate: mutateReportComments,
    isLoading: isReportCommentsLoading,
  } = useSWR(report?.report_id, async (report_id) => {
    return await api.get("/api/v3/comments", {
      conversation_id: conversation_info.conversation_id,
      report_id,
      mod_gt: -1,
      moderation: true,
      include_voting_patterns: true,
    })
  })

  const generateReport = useCallback(async () => {
    await api.post("/api/v3/reports", { conversation_id: conversation_info.conversation_id })
    await refresh()
  }, [])

  const refresh = useCallback(async () => {
    await mutateReport()
    await mutateReportComments()
  }, [mutateReport, mutateReportComments])

  const [showReport, setShowReport] = useState<boolean>(false)

  const maxCount = useMemo(() =>
    reportComments ?
     Math.max.apply(
      this,
      reportComments.map((comment) => comment.count),
    ) : 0
  , [reportComments])

  return <Box sx={{ ...dashboardBox, bg: "bgOffWhite" }}>
    <Box sx={{ display: "flex", fontWeight: 700, mb: [3] }}>
      <Text sx={{ flex: 1 }}>Polls for this discussion thread</Text>
      <Link
        variant="links.a"
        href="#"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowReport(!showReport)
        }}
        sx={{ fontSize: "0.96em" }}
      >
        {showReport ? "Back to voting" : "Preview results"}
      </Link>
    </Box>
    {!showReport ? (
      <Survey
        key={conversation_info.conversation_id}
        conversation_id={conversation_info.conversation_id}
        help_type={conversation_info.help_type}
        postsurvey={conversation_info.postsurvey}
        postsurvey_limit={conversation_info.postsurvey_limit}
        postsurvey_redirect={conversation_info.postsurvey_redirect}
        auth_needed_to_write={conversation_info.auth_needed_to_write}
      />
    ) : (
      <Box>
        {!(isReportLoading || isReportCommentsLoading) && report && (
          <Box>
            {(reportComments || []).length === 0 && (
              <Box sx={{ ...surveyBox, padding: "50px 32px", fontWeight: 500 }}>
                No responses for this{" "}
                {conversation_info.fip_version ? "FIP" : "discussion"} yet.
              </Box>
            )}
          </Box>
        )}
        {!(isReportLoading || isReportCommentsLoading) &&
          (reportComments || []).map((c: ReportComment) => (
            <ReportCommentRow key={c.tid} reportComment={c} maxCount={maxCount} />
          ))}
        <Box
          sx={{
            fontSize: "0.94em",
            mt: "20px",
            color: "#9f9e9b",
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          {!report && (
            <Box>
              <Box sx={{ pt: [2], pb: [3] }}>
                <Box>A report is only generated once a user has requested it.</Box>
                <Box>Click continue to generate a report:</Box>
              </Box>
              <Button variant="buttons.black" onClick={(e) => {
                e.stopPropagation()
                generateReport()
              }} sx={{ mb: [3] }}>
                Continue to report...
              </Button>
            </Box>
          )}
          {report && (
            <React.Fragment>
              <RouterLink to={`/r/${conversation_info?.conversation_id}/${report?.report_id}`}>
                <Text as="span" variant="links.text">
                  View full report
                </Text>
              </RouterLink>
              <Text
                as="span"
                variant="links.text"
                onClick={(e) => {
                  e.stopPropagation()
                  refresh()
                }}
                sx={{ ml: [2] }}
              >
                Refresh report
              </Text>
            </React.Fragment>
          )}
        </Box>
      </Box>
    )}
  </Box>
}

export default ReportAndSurveyInfo
