/** @jsx jsx */

import React, { useState } from "react"
import { Box, Heading, Button, Text, Textarea, Flex, jsx } from "theme-ui"

import { surveyBox, surveyHeadingMini } from "./index"
import SurveyCard from "./survey_card"
import SurveyCompose from "./survey_compose"

const PostSurvey = ({ user, conversation_id, votedComments, zid_metadata, goTo }) => {
  return (
    <React.Fragment>
      {zid_metadata.postsurvey ? (
        <Box sx={{ ...surveyBox, pt: [5], pb: [5] }}>
          <Heading as="h3" sx={{ ...surveyHeadingMini, fontSize: "22px" }}>
            Nice work!
          </Heading>
          <Text sx={{ mb: [5] }}>{zid_metadata.postsurvey}</Text>
          <Button
            variant="outline"
            sx={{ width: "100%" }}
            onClick={() => {
              goTo("voting")
            }}
          >
            I’d like to keep voting
          </Button>
        </Box>
      ) : (
        <React.Fragment>
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
        </React.Fragment>
      )}
    </React.Fragment>
  )
}
export default PostSurvey
