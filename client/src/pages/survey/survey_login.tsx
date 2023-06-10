import React from "react"
import { Box, Heading, Button, Text, Textarea, Flex, Link, jsx } from "theme-ui"

import { surveyHeading } from "./index"

const SurveyLogin = ({ onNext, onPrev }) => {
  return (
    <Box>
      <Heading as="h3" sx={surveyHeading}>
        Before we begin...
      </Heading>
      <Text sx={{ mb: [3] }}>
        This survey requires you to be logged in with an email or identity provider.
      </Text>
      <Text sx={{ mb: [3] }}>Your identity won’t be publicly associated with your answers.</Text>
      <Flex sx={{ mt: [5] }}>
        <Box sx={{ flex: 1 }}>
          <Button variant="primary" onClick={onNext}>
            Continue
          </Button>
        </Box>
        <Link
          onClick={onPrev}
          sx={{
            display: "inline",
            my: [2],
            mx: "22px",
            fontFamily: "monospace",
            color: "mediumGray",
          }}
        >
          Back
        </Link>
      </Flex>
    </Box>
  )
}

export default SurveyLogin
