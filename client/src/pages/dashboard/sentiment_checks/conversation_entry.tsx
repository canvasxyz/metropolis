import React, { useState } from "react"
import { TbCalendar, TbCaretDown, TbCaretRight } from "react-icons/tb"

import { Badge, Box, Flex, Grid, Text } from "@radix-ui/themes"
import { ConversationSummary } from "../../../reducers/conversations_summary"
import ReportAndSurveyInfo from "../report_and_survey_info"
import { SentimentCheckComments } from "../sentiment_check_comments"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

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
  const fipAttributes = []
  if (showCreationDate) {
    fipAttributes.push(
      <Flex
        align="center"
        gap="1"
      >
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
        m="10px"
        columns="20px 1fr"
        gridRow="auto auto"
        gapY="10px"
        gapX="10px"
      >
        <Flex
          direction="row"
          gap="4"
          align="center"
        >
          {isOpen ? <TbCaretDown /> : <TbCaretRight />}
        </Flex>
        <Flex
          direction="row"
          gap="3"
          align="center"
         >
          <Text
            size="2"
            style={{ flex: 1, lineHeight: 1.3, fontSize: "95%", fontWeight: 500 }}
          >
            {conversation.displayed_title || <Text color="gray">Untitled</Text>}
          </Text>
          <Badge size="2" color={color} variant="surface" radius="full">
            {statusLabel}
          </Badge>
        </Flex>
        <Box></Box>
        <Flex
          direction="row"
          gap="2"
          align="center"
          style={{ fontSize: "90%" }}
        >
          {fipAttributes.map((attr, i) => (
            <Text key={i} style={{ fontSize: "94%", opacity: 0.7, whiteSpace: "nowrap" }} >
              {i > 0 && (
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
          <Box flexGrow="1"></Box>
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
            <Box
              py="18px"
              px="22px"
              // my: [3]
              style={{
                backgroundColor: "white",
                border: "1px solid #ddd",
                lineHeight: "1.35",
              }}
            >
              <Box pb="1">
                <Text weight="bold">
                  Comments
                </Text>
              </Box>
              {/* <Box sx={{ color: "mediumGray", pb: [1] }}>
                Have more to say? You can leave a short comment here.
                </Box> */}
              <Box mx="-8px" pt="8px">
                <SentimentCheckComments conversationId={conversation.conversation_id} />
              </Box>
            </Box>
          </>
        }
      </Grid>
    </div>
  )
}
