import React, { useState, useEffect } from "react"
import { Box, Heading, Button, Text, Textarea, Flex, Link, jsx } from "theme-ui"

import SurveyCard from "./survey_card"
import { surveyHeading } from "./index"

const SurveyInstructions = ({
  onNext,
  onPrev,
  limit,
}: {
  onNext: Function
  onPrev: Function
  limit: number
}) => {
  const cardsText = limit ? `a batch of ${limit} comments` : "comments written by other people"

  return (
    <Box>
      <Heading as="h3" sx={surveyHeading}>
        About this survey
      </Heading>
      <Text sx={{ mt: [4], mb: [2] }}>
        This is a collaborative survey, where you can contribute comments that everyone votes on.
      </Text>
      <Text sx={{ my: [2] }}>
        You’ll be shown {cardsText}, and asked to <strong>Agree</strong>, <strong>Disagree</strong>,
        or <strong>Skip</strong>.
      </Text>
      <Text>
        <ul>
          <li>
            If you generally agree, select Agree. You can also check a box to indictate if you
            identify strongly with the comment.
          </li>
          <li>If you disagree or think the comment doesn’t make sense, select Disagree.</li>
          <li>If you don’t think it’s relevant or are unsure, select Skip.</li>
        </ul>
      </Text>
      <Box sx={{ mt: [5] }}>
        <Button variant="primary" onClick={onNext}>
          Continue
        </Button>
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
      </Box>
    </Box>
  )
}

export default SurveyInstructions
