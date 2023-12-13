/** @jsx jsx */

import { Fragment, useCallback, useEffect, useState } from "react"
import { Heading, Link, Box, Flex, Text, Button, jsx } from "theme-ui"
import { Link as RouterLink, useHistory } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { TbSettings } from "react-icons/tb"

import api from "../../util/api"
import { Frontmatter } from "../Frontmatter"
import Survey from "../survey"

export const DashboardConversation = ({ conversation, zid_metadata }) => {
  const collapsibleConversation = conversation.description.length > 300
  const [collapsed, setCollapsed] = useState(collapsibleConversation ? true : false)
  const hist = useHistory()
  const [report, setReport] = useState<{ report_id: string }>()

  const generateReport = () => {
    api
      .post("/api/v3/reports", {
        conversation_id: zid_metadata.conversation_id,
      })
      .then(() => {
        api
          .get("/api/v3/reports", {
            conversation_id: zid_metadata.conversation_id,
          })
          .then((reports) => {
            setReport(reports[0])
          })
      })
  }

  useEffect(() => {
    setCollapsed(collapsibleConversation ? true : false)
    api
      .get("/api/v3/reports", {
        conversation_id: zid_metadata.conversation_id,
      })
      .then((reports) => {
        setReport(reports[0])
      })
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
            className={collapsed ? "css-fade" : ""}
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
          <Heading as="h2">Peer Review</Heading>
          <Survey
            match={{
              params: { conversation_id: conversation.conversation_id },
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}
