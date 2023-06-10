import React from "react"
import { Box, Heading, Button, Text, Textarea, Flex, jsx } from "theme-ui"

import { surveyBox, surveyHeadingMini } from "./index"
import SurveyCard from "./survey_card"

const SurveyCards = ({ conversation_id, votedComments, unvotedComments, onVoted }) => {
  return (
    <Box>
      <Box>
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
          <Box sx={{ ...surveyBox }}>
            <Heading as="h3" sx={{ ...surveyHeadingMini, fontSize: "22px" }}>
              You’re done for now!
            </Heading>
            <Text sx={{ mb: [3] }}>
              You’ve voted on all {votedComments.length} comments in the survey so far.
            </Text>
            <Text sx={{ mb: [2] }}>
              Come back to this page to see comments as they’re submitted by others. Or, try
              contributing a few of your own!
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default SurveyCards
