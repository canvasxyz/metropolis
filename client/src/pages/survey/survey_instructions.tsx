import React, { useState, useEffect } from "react"
import SurveyCard from "./survey_card"
import { Box, Heading, Button, Text, Textarea, Flex, jsx } from "theme-ui"

const SurveyInstructions = () => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const stg = localStorage.getItem("polis-instructions-visible")
    if (stg === "false") {
      setVisible(false)
    }
  }, [])

  // TODO: let user set limit
  const limit = null
  const cardsText = limit ? `a batch of ${limit} comments` : "comments written by other people"

  if (visible === false) return <></>

  return (
    <Box
      sx={{
        mb: [3, null, 4],
        margin: "0 auto",
        border: "1px solid",
        borderColor: "lighterGray",
        px: "40px",
        py: "36px",
        borderRadius: "8px",
      }}
    >
      <Text sx={{ my: [2] }}>
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
      <Box sx={{ mt: [4] }}>
        <Button
          variant="primary"
          onClick={() => {
            setVisible(false)
            localStorage.setItem("polis-instructions-visible", "false")
          }}
        >
          Continue
        </Button>
      </Box>
    </Box>
  )
}

export default SurveyInstructions
