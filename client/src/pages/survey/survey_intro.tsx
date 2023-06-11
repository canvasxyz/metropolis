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
      <Box>
        {zid_metadata?.description ? (
          <Text>{zid_metadata.description}</Text>
        ) : (
          <Text sx={{ color: "mediumGray" }}>
            The creator of this survey hasn’t created a description yet. Press continue to get
            started.
          </Text>
        )}
      </Box>
      <Box sx={{ mt: [5] }}>
        <Button variant="primary" onClick={onNext}>
          Continue
        </Button>
      </Box>
    </Box>
  )
}

export default SurveyIntro
