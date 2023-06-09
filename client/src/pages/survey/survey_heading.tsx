import React from "react"
import SurveyCard from "./survey_card"
import { Box, Heading, Button, Text, Textarea, Flex, jsx } from "theme-ui"

const SurveyHeading = ({ zid_metadata }) => {
  return (
    <Box
      sx={{
        mb: [3, null, 4],
      }}
    >
      <Heading
        as="h3"
        sx={{
          fontSize: [3, null, 4],
          lineHeight: "body",
          mb: [2],
        }}
      >
        {!zid_metadata.topic ? (
          <Text sx={{ color: "lightGray" }}>Untitled Conversation</Text>
        ) : (
          zid_metadata.topic
        )}
      </Heading>
      {zid_metadata?.description && <Box sx={{ mb: [3, null, 4] }}>{zid_metadata.description}</Box>}
    </Box>
  )
}

export default SurveyHeading
