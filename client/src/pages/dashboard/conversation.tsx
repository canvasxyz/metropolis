/** @jsx jsx */

import React, { useEffect, useState } from "react"
import { Heading, Link, Box, Flex, Text, Button, jsx } from "theme-ui"
import { Link as RouterLink, useHistory } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { TbSettings } from "react-icons/tb"

import api from "../../util/api"
import { Frontmatter } from "../Frontmatter"
import Survey from "../survey"

type ReportComment = {
  active: boolean
  agree_count: number
  conversation_id: string
  count: number
  created: string
  disagree_count: number
  is_meta: boolean
  is_seed: boolean
  lang: string | null
  mod: number
  pass_count: number
  pid: number
  quote_src_url: string | null
  tid: number
  tweet_id: string | null
  txt: string
  velocity: number
}

export const DashboardConversation = ({
  conversation,
  zid_metadata,
}: {
  conversation
  zid_metadata
}) => {
  const collapsibleConversation = conversation.description.length > 300
  const [collapsed, setCollapsed] = useState(!!collapsibleConversation)
  const hist = useHistory()
  const [report, setReport] = useState<{ report_id: string }>()
  const [reportComments, setReportComments] = useState<ReportComment[]>([])
  const [maxCount, setMaxCount] = useState<number>(0)
  const [refreshInProgress, setRefreshInProgress] = useState(false)

  const generateReport = () => {
    api
      .post("/api/v3/reports", { conversation_id: zid_metadata.conversation_id })
      .then(() => refreshReport())
  }

  const refreshReport = () => {
    setRefreshInProgress(true)
    api
      .get("/api/v3/reports", { conversation_id: zid_metadata.conversation_id })
      .then((reports) => {
        setReport(reports[0])
        if (!reports[0]) return
        api
          .get("/api/v3/comments", {
            conversation_id: zid_metadata.conversation_id,
            report_id: reports[0].report_id,
            mod_gt: -1,
            moderation: true,
            include_voting_patterns: true,
          })
          .then((comments) => {
            setReportComments(comments)
            setMaxCount(
              Math.max.apply(
                this,
                comments.map((comment) => comment.count),
              ),
            )
          })
      })
      .always(() => setRefreshInProgress(false))
  }

  useEffect(() => {
    setReport(undefined)
    setReportComments([])
    setCollapsed(!!collapsibleConversation)
    if (!zid_metadata.conversation_id) return
    refreshReport()
  }, [zid_metadata.conversation_id])

  return (
    <Box>
      {zid_metadata.is_owner && (
        <Box
          sx={{
            position: "sticky",
            top: [3],
            pl: [4],
            alignItems: "center",
            display: "flex",
            gap: [2],
            zIndex: 9998,
          }}
        >
          <Button
            variant="outlineSecondary"
            sx={{
              alignItems: "center",
              display: "flex",
              gap: [1],
            }}
            onClick={() => hist.push(`/m/${zid_metadata.conversation_id}`)}
          >
            <Box>
              <TbSettings />
            </Box>
            <Text>Edit</Text>
          </Button>
          <Button
            variant="outlineSecondary"
            sx={{
              alignItems: "center",
              display: "flex",
              gap: [1],
            }}
            onClick={() => hist.push(`/m/${zid_metadata.conversation_id}/comments`)}
          >
            Moderate
          </Button>
          {!report && (
            <Button variant="outlineSecondary" onClick={generateReport}>
              Generate Report
            </Button>
          )}
          {report && (
            <Button
              variant="outlineSecondary"
              onClick={() => hist.push(`/r/${zid_metadata.conversation_id}/${report.report_id}`)}
            >
              View Report
            </Button>
          )}
          <Box sx={{ flex: 1 }}></Box>
        </Box>
      )}
      <Box sx={{ width: "100%" }}>
        <Flex
          sx={{
            flexDirection: "column",
            gap: [2],
            margin: "0 auto",
            pt: [7],
            pb: [2],
            px: [4],
            maxWidth: "620px",
          }}
        >
          <Heading as="h2">
            {conversation.fip_title || conversation.github_pr_title || conversation.topic}
          </Heading>
          <Frontmatter conversation={conversation} />
          <Box
            className={collapsed ? "react-markdown css-fade" : "react-markdown"}
            sx={
              collapsed
                ? { wordBreak: "break-word", maxHeight: "170px", overflow: "hidden" }
                : { wordBreak: "break-word", mb: [3] }
            }
          >
            <ReactMarkdown skipHtml={true} remarkPlugins={[remarkGfm]} linkTarget="_blank">
              {conversation.description}
            </ReactMarkdown>
          </Box>
          {collapsibleConversation && (
            <Link
              href="#"
              onClick={() => setCollapsed(!collapsed)}
              variant="links.primary"
              sx={{
                color: "mediumGrayActive",
                py: "11px",
                textAlign: "center",
                bg: "#ede4d166",
                fontSize: "0.94em",
                borderRadius: 7,
                "&:hover": { bg: "#ede4d1aa" },
              }}
            >
              {collapsed ? "Show more" : "Show less"}
            </Link>
          )}
        </Flex>
      </Box>
      <Box sx={{ width: "100%", position: "relative", borderTop: "1px solid #e2ddd5", mt: [4] }}>
        <Box
          sx={{
            margin: "0 auto",
            maxWidth: "620px",
            px: [4],
            py: [2],
            mt: [4],
            lineHeight: 1.45,
          }}
        >
          <Heading as="h2">Sentiment Check</Heading>
          <Survey
            match={{
              params: { conversation_id: conversation.conversation_id },
            }}
          />
        </Box>
      </Box>
      <Box
        sx={{
          width: "100%",
          position: "relative",
          borderTop: "1px solid #e2ddd5",
          pb: [6],
        }}
      >
        <Box
          sx={{
            margin: "0 auto",
            maxWidth: "620px",
            px: [4],
            py: [2],
            mt: [4],
            lineHeight: 1.45,
          }}
        >
          <Heading as="h2">Sentiment Report</Heading>
          <Box sx={{ mt: [4] }}>
            {!refreshInProgress && (
              <Text
                sx={{
                  fontSize: "0.9em",
                  mb: "10px",
                  color: "#9f9e9b",
                  fontWeight: 500,
                  textAlign: "center",
                }}
              >
                {reportComments.length > 0
                  ? "Here are the top comments so far:"
                  : "No comments yet. "}
              </Text>
            )}
            {!refreshInProgress &&
              reportComments.map((c: ReportComment) => (
                <ReportCommentRow key={c.tid} reportComment={c} maxCount={maxCount} />
              ))}
            <Text
              sx={{
                fontSize: "0.9em",
                mt: "10px",
                color: "#9f9e9b",
                fontWeight: 500,
                textAlign: "center",
              }}
            >
              {!report && (
                <Text as="span" variant="links.text" onClick={generateReport}>
                  Generate Report
                </Text>
              )}
              {report && (
                <RouterLink to={`/r/${zid_metadata?.conversation_id}/${report?.report_id}`}>
                  <Text as="span" variant="links.text">
                    View full report
                  </Text>
                </RouterLink>
              )}
              {report && (
                <Text as="span" variant="links.text" onClick={refreshReport} sx={{ ml: [2] }}>
                  Refresh report
                </Text>
              )}
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

const ReportCommentRow = ({
  reportComment,
  maxCount,
}: {
  reportComment: ReportComment
  maxCount: number
}) => {
  const { agree_count, disagree_count, pass_count, tid, txt } = reportComment
  const row = { display: "flex" }
  const bar = { px: "1px", py: "2px", lineHeight: 1.2 }
  const text = { display: "inline-block", fontSize: "0.88em", position: "relative", left: "4px" }

  return (
    <Box key={tid}>
      <Box
        sx={{
          bg: "bgOffWhite",
          border: "1px solid #e2ddd5",
          borderRadius: "7px",
          mb: [1],
          pt: "12px",
          pb: "10px",
          pl: "20px",
          pr: "15px",
          display: "flex",
        }}
      >
        <Text sx={{ margin: "auto", fontSize: "0.91em", lineHeight: 1.3, flex: 1, pr: [1] }}>
          {txt}
        </Text>
        <Box sx={{ position: "relative", pl: [3] }}>
          <Box sx={row}>
            <Box sx={{ width: 70, ...text }}>Agree</Box>
            <Box sx={{ width: 70 }}>
              <Box
                sx={{
                  width: `${Math.ceil((agree_count / maxCount) * 100)}%`,
                  bg: "#2fcc71",
                  ...bar,
                }}
              >
                <Text sx={text}>{agree_count}</Text>
              </Box>
            </Box>
          </Box>
          <Box sx={row}>
            <Box sx={{ width: 70, ...text }}>Disagree</Box>
            <Box sx={{ width: 70 }}>
              <Box
                sx={{
                  width: `${Math.ceil((disagree_count / maxCount) * 100)}%`,
                  bg: "#e74b3c",
                  color: "#fff",
                  ...bar,
                }}
              >
                <Text sx={text}>{disagree_count}</Text>
              </Box>
            </Box>
          </Box>
          <Box sx={row}>
            <Box sx={{ width: 70, ...text }}>Pass</Box>
            <Box sx={{ width: 70 }}>
              <Box
                sx={{
                  width: `${Math.ceil((pass_count / maxCount) * 100)}%`,
                  bg: "#e6e6e6",
                  ...bar,
                }}
              >
                <Text sx={text}>{pass_count}</Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
