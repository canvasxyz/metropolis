import React from "react"
import { Box, Heading, Button, Text, Textarea, Flex, jsx } from "theme-ui"

import { surveyBox, surveyHeading } from "./index"
import SurveyCard from "./survey_card"

const SurveyIntro = ({ zid_metadata, onNext }) => {
  return (
    <Box>
      <Heading as="h3" sx={surveyHeading}>
        {!zid_metadata.topic ? "About this survey" : zid_metadata.topic}
      </Heading>
      {zid_metadata?.description && (
        <Box sx={{ ...surveyBox, border: "none", padding: "none", bg: "none" }}>
          <Text>{zid_metadata.description}</Text>
          <Box sx={{ mt: [5] }}>
            <Button variant="primary" onClick={onNext}>
              Continue
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default SurveyIntro
