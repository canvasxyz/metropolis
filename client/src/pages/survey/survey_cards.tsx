import React from "react"
import { Box, Heading, Button, Text, Textarea, Flex, jsx } from "theme-ui"

import { surveyBox } from "./index"
import SurveyCard from "./survey_card"

const SurveyCards = ({ conversation_id, votedComments, unvotedComments, onVoted }) => {
  return (
    <Box>
      <Flex>
        <Text sx={{ color: "lightGray", margin: "20px auto" }}>
          You’ve voted on {votedComments.length} of {votedComments.length + unvotedComments.length}{" "}
          comments
        </Text>
      </Flex>
      <Box sx={{ pb: "180px" }}>
        {unvotedComments.map((comment, i) => (
          <SurveyCard
            key={comment.tid}
            comment={comment}
            conversationId={conversation_id}
            onVoted={onVoted}
            hasVoted={false}
            stacked={true}
          />
        ))}
        {unvotedComments.length === 0 && (
          <Box
            sx={{
              ...surveyBox,
              // boxShadow: "1px 1px 4px rgba(0,0,0,0.04)",
              // width: "100%",
              height: "180px",
              // textAlign: "center",
              mb: "-120px",
            }}
          >
            <p>It looks like you've voted on everything.</p>
            <p>Have you tried writing a comment yet?</p>
          </Box>
        )}
      </Box>
      <Flex>
        <Text sx={{ color: "lightGray", margin: "20px auto" }}>
          Review comments you've voted on
        </Text>
      </Flex>
      <Box sx={{ pb: "180px" }}>
        {votedComments.map((comment, i) => (
          <SurveyCard
            key={comment.tid}
            comment={comment}
            conversationId={conversation_id}
            onVoted={onVoted}
            hasVoted={true}
            stacked={true}
          />
        ))}
      </Box>
    </Box>
  )
}

export default SurveyCards
