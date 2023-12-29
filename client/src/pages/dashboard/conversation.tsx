/** @jsx jsx */

import React, { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { Heading, Link, Box, Flex, Text, Button, jsx } from "theme-ui"
import { Link as RouterLink, useHistory } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  TbArchive,
  TbArchiveOff,
  TbPencil,
  TbSettings,
  TbBrandGithub,
  TbFlame,
  TbHammer,
} from "react-icons/tb"

import { RootState } from "../../store"
import { useAppSelector, useAppDispatch } from "../../hooks"
import api from "../../util/api"
import { Frontmatter } from "../Frontmatter"
import Survey from "../survey"
import {
  handleModerateConversation,
  handleUnmoderateConversation,
  handleCloseConversation,
  handleReopenConversation,
  populateZidMetadataStore,
} from "../../actions"

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
  selectedConversationId,
}: {
  selectedConversationId: string
}) => {
  const hist = useHistory()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state: RootState) => state.user)
  const { zid_metadata, error: zidMetadataError } = useAppSelector(
    (state: RootState) => state.zid_metadata,
  )

  const [report, setReport] = useState<{ report_id: string }>()
  const [reportComments, setReportComments] = useState<ReportComment[]>([])
  const [maxCount, setMaxCount] = useState<number>(0)
  const [refreshInProgress, setRefreshInProgress] = useState(false)

  useEffect(() => {
    setReport(undefined)
    setReportComments([])
    if (!zid_metadata.conversation_id) return
    refreshReport()
  }, [zid_metadata.conversation_id])

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
    dispatch(populateZidMetadataStore(selectedConversationId))
  }, [selectedConversationId])

  useEffect(() => {
    if (zidMetadataError) {
      toast.error("Couldn't retrieve conversation")
      // redirect to main dashboard
      hist.push(`/dashboard`)
    }
  }, [zidMetadataError])

  return (
    <Box>
      {zid_metadata.is_owner && (
        <Box
          sx={{
            position: "absolute",
            top: [3],
            pl: [4],
            alignItems: "center",
            display: "flex",
            gap: [2],
            zIndex: 1,
          }}
        >
          <Button
            variant="outlineSecondary"
            onClick={() => hist.push(`/m/${zid_metadata.conversation_id}`)}
          >
            <TbPencil /> Edit
          </Button>
          <Button
            variant="outlineSecondary"
            onClick={() => hist.push(`/m/${zid_metadata.conversation_id}/comments`)}
          >
            <TbHammer /> Moderate
          </Button>
          {user.githubRepoCollaborator && (
            <Button
              variant="outlineSecondary"
              onClick={() => {
                if (zid_metadata.is_hidden) {
                  if (!confirm("Show this proposal to users again?")) return
                  dispatch(handleUnmoderateConversation(zid_metadata.conversation_id))
                } else {
                  if (!confirm("Hide this proposal from users?")) return
                  dispatch(handleModerateConversation(zid_metadata.conversation_id))
                }
              }}
            >
              <TbFlame /> {zid_metadata.is_hidden ? "Unmark spam" : "Mark as spam"}
            </Button>
          )}
          {(zid_metadata.is_owner || user.githubRepoCollaborator) &&
            !zid_metadata.github_pr_title && (
              <Button
                variant="outlineSecondary"
                onClick={() => {
                  if (zid_metadata.is_archived) {
                    if (!confirm("Close this discussion?")) return
                    dispatch(handleReopenConversation(zid_metadata.conversation_id))
                    location.reload()
                  } else {
                    if (!confirm("Reopen this discussion?")) return
                    dispatch(handleCloseConversation(zid_metadata.conversation_id))
                    location.reload()
                  }
                }}
              >
                {zid_metadata.is_archived ? <TbArchiveOff /> : <TbArchive />}{" "}
                {zid_metadata.is_archived ? "Reopen" : "Mark as closed"}
              </Button>
            )}
        </Box>
      )}
      <Box sx={{ width: "100%" }}>
        <Flex
          sx={{
            flexDirection: "column",
            gap: [2],
            margin: "0 auto",
            pt: [8],
            pb: [2],
            mt: [3],
            px: [4],
            maxWidth: "620px",
          }}
        >
          <Heading as="h2">
            {zid_metadata.fip_title || zid_metadata.github_pr_title || zid_metadata.topic}
          </Heading>
          {!zid_metadata.fip_title && !zid_metadata.github_pr_title && (
            <Text sx={{ fontSize: "0.94em" }}>
              Created by{" "}
              <Text
                variant="links.a"
                as="a"
                target="_blank"
                rel="noreferrer"
                href={`https://github.com/${zid_metadata.github_username}`}
              >
                {zid_metadata.github_username}
              </Text>
            </Text>
          )}
          <Frontmatter zid_metadata={zid_metadata} />
          {zid_metadata.description && (
            <Collapsible
              key={zid_metadata.conversation_id}
              shouldCollapse={zid_metadata.description?.length > 300}
            >
              <ReactMarkdown skipHtml={true} remarkPlugins={[remarkGfm]} linkTarget="_blank">
                {zid_metadata.description}
              </ReactMarkdown>
            </Collapsible>
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
              params: { conversation_id: zid_metadata.conversation_id },
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

const Collapsible = ({
  children,
  shouldCollapse,
}: {
  children: React.ReactElement
  shouldCollapse: boolean
}) => {
  const [collapsed, setCollapsed] = useState(shouldCollapse)

  return (
    <React.Fragment>
      <Box
        className={collapsed ? "react-markdown css-fade" : "react-markdown"}
        sx={
          collapsed
            ? { wordBreak: "break-word", maxHeight: "170px", overflow: "hidden" }
            : { wordBreak: "break-word", mb: [3] }
        }
      >
        {children}
      </Box>
      {shouldCollapse && (
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
    </React.Fragment>
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
                  color: agree_count / maxCount < 0.2 ? "#222" : "#fff",
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
                  color: disagree_count / maxCount < 0.2 ? "#222" : "#fff",
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
