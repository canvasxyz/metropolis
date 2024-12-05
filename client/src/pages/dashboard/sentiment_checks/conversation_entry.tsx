import React, { useState } from "react"
import { TbCalendar, TbCaretDown, TbCaretRight } from "react-icons/tb"
import { Box, Flex, Grid } from "theme-ui"

import { Badge, Text } from "@radix-ui/themes"
import { ConversationSummary } from "../../../reducers/conversations_summary"
import ReportAndSurveyInfo from "../report_and_survey_info"
import { SentimentCheckComments } from "../sentiment_check_comments"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const dashboardBox = {
  bg: "bgWhite",
  py: "18px",
  px: "22px",
  // my: [3],
  lineHeight: 1.35,
  border: "1px solid #ddd",
}

export const ConversationEntry = ({
  conversation,
  showCreationDate,
}: {
  conversation: ConversationSummary & {
    displayed_title: string
  }
  showCreationDate: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const fipBadges = []
  const fipAttributes = []
  if (showCreationDate) {
    fipAttributes.push(
      <Flex sx={{ display: "inline-block", alignItems: "center", gap: [1], whiteSpace: "nowrap" }}>
        <TbCalendar />
        <Text> {new Date(conversation.created).toLocaleDateString()}</Text>
      </Flex>,
    )
  }

  const color = conversation.is_archived ? "gray" : "blue"
  const statusLabel = conversation.is_archived ? "Archived" : "Active"

  return (
    <div
      style={{
        cursor: "pointer",
        borderRadius: "8px",
        borderStyle: "solid",
        borderWidth: "1px",
        borderLeftWidth: "4px",
        // this uses the color palette defined by radix-ui
        borderColor: color === "gray" ? `#ccc` : `var(--${color}-10)`,
        padding: "3px 0 6px",
        background: "#fff",
      }}
      onClick={() => setIsOpen(!isOpen)}
    >
      <Grid
        sx={{
          margin: "10px",
          gridTemplateColumns: "20px 1fr",
          gridRow: "auto auto",
          gridColumnGap: "20px",
          gridRowGap: "10px",
        }}
      >
        <Flex sx={{ flexDirection: "row", gap: [4], alignItems: "center" }}>
          {isOpen ? <TbCaretDown /> : <TbCaretRight />}
        </Flex>
        <Flex sx={{ flexDirection: "row", gap: [3], alignItems: "center" }}>
          <Text style={{ flex: 1, lineHeight: 1.3, fontSize: "95%", fontWeight: 500 }}>
            {conversation.displayed_title || <Text sx={{ color: "#84817D" }}>Untitled</Text>}
          </Text>
          <Badge size="2" color={color} variant="surface" radius="full">
            {statusLabel}
          </Badge>
        </Flex>
        <Box></Box>
        <Flex sx={{ flexDirection: "row", gap: [2], alignItems: "center", fontSize: "90%" }}>
          {fipBadges}
          {fipAttributes.map((attr, i) => (
            <Text key={i} style={{ fontSize: "94%", opacity: 0.7, whiteSpace: "nowrap" }}>
              {fipBadges.length > 0 || i > 0 && (
                <Text
                  style={{
                    marginLeft: "2px",
                    marginRight: "9px",
                    top: "-1px",
                    position: "relative",
                    opacity: 0.5,
                  }}
                >
                  |
                </Text>
              )}
              {attr}
            </Text>
          ))}
          <Box sx={{ flexGrow: "1" }}></Box>
        </Flex>
        { isOpen &&
          <>
            <Box></Box>
            <Box>
              <ReactMarkdown
                skipHtml={true}
                remarkPlugins={[remarkGfm]}
                linkTarget="_blank"
                className="react-markdown"
              >
                {conversation.description}
              </ReactMarkdown>
            </Box>
            <Box></Box>
            <ReportAndSurveyInfo conversation_info={conversation}/>
            <Box></Box>
            <Box sx={dashboardBox}>
              <Box sx={{ fontWeight: "bold", pb: [1] }}>Comments</Box>
              {/* <Box sx={{ color: "mediumGray", pb: [1] }}>
                Have more to say? You can leave a short comment here.
                </Box> */}
              <Box sx={{ mx: "-8px", pt: "8px" }}>
                <SentimentCheckComments conversationId={conversation.conversation_id} />
              </Box>
            </Box>
          </>
        }
      </Grid>
    </div>
  )
}
