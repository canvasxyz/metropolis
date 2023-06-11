import React from "react"
import { Box, Heading, Button, Text, Textarea, Flex, jsx } from "theme-ui"

import { surveyBox, surveyHeadingMini } from "./index"
import SurveyCard from "./survey_card"

const SurveyCards = ({ conversation_id, votedComments, unvotedComments, onVoted }) => {
  return (
    <Box>
      <Box>
        {unvotedComments.length > 0 && (
          <Box
            sx={{
              position: "relative",
              maxHeight: "300px",
              overflow: "hidden",
              pb: "40px",
              mb: "40px",
            }}
          >
            {unvotedComments.slice(0, 2).map((comment, i) => {
              return (
                <SurveyCard
                  key={comment.tid}
                  comment={comment}
                  conversationId={conversation_id}
                  onVoted={onVoted}
                  hasVoted={false}
                  stacked={true}
                />
              )
            })}
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                l: 0,
                width: "100%",
                textAlign: "center",
                pt: "120px",
                pointerEvents: "none",
                backgroundImage: `
  linear-gradient(
    to bottom,
    hsla(0, 0%, 100%, 0) 0%,
    hsla(0, 0%, 100%, 0.013) 8.1%,
    hsla(0, 0%, 100%, 0.049) 15.5%,
    hsla(0, 0%, 100%, 0.104) 22.5%,
    hsla(0, 0%, 100%, 0.175) 29%,
    hsla(0, 0%, 100%, 0.259) 35.3%,
    hsla(0, 0%, 100%, 0.352) 41.2%,
    hsla(0, 0%, 100%, 0.45) 47.1%,
    hsla(0, 0%, 100%, 0.55) 52.9%,
    hsla(0, 0%, 100%, 0.648) 58.8%,
    hsla(0, 0%, 100%, 0.741) 64.7%,
    hsla(0, 0%, 100%, 0.825) 71%,
    hsla(0, 0%, 100%, 0.896) 77.5%,
    hsla(0, 0%, 100%, 0.951) 84.5%,
    hsla(0, 0%, 100%, 0.987) 91.9%,
    hsl(0, 0%, 100%) 100%
  )`,
                // should create a proper gradient with stops here
              }}
            ></Box>
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                l: 0,
                width: "100%",
                textAlign: "center",
                pt: "0px",
              }}
            >
              <Text
                sx={{
                  display: "inline-block",
                  borderRadius: "9999px",
                  p: "2px 12px 1px",
                  fontFamily: "monospace",
                  fontSize: "0.92em",
                  color: "lightGrayActive",
                  bg: "lighterGray",
                  cursor: "pointer",
                  "&:hover": {
                    color: "mediumGray",
                  },
                }}
              >
                {unvotedComments.length} left
              </Text>
            </Box>
          </Box>
        )}
        {unvotedComments.length === 0 && votedComments.length === 0 && (
          <Box sx={{ ...surveyBox, pt: [5] }}>
            <Heading as="h3" sx={{ ...surveyHeadingMini, fontSize: "22px" }}>
              No comments
            </Heading>
            <Text sx={{ mb: [3] }}>
              Nobody has added any comments to this survey yet. If commenting is enabled, you could
              be the first!
            </Text>
          </Box>
        )}
        {unvotedComments.length === 0 && votedComments.length !== 0 && (
          <Box sx={{ ...surveyBox, pt: [5] }}>
            <Heading as="h3" sx={{ ...surveyHeadingMini, fontSize: "22px" }}>
              You’re done for now!
            </Heading>
            <Text sx={{ mb: [2] }}>
              You’ve voted on all {votedComments.length} comments submitted so far.
            </Text>
            <Text sx={{ mb: [2] }}>
              Come back to this page to see new comments as they’re written by others.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default SurveyCards
