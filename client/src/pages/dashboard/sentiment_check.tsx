/** @jsx jsx */

import React, { useState } from "react"
import { Button, Heading, Link, Box, Flex, Text, jsx } from "theme-ui"
import { Link as RouterLink, useHistory } from "react-router-dom"

export const SentimentCheck: React.FC<{ user }> = ({ user }) => {
  const [supported, setSupported] = useState([])
  const [opposed, setOpposed] = useState([])
  const [neutral, setNeutral] = useState([])

  const voteSupport = (e) => {
    e.preventDefault()
    if (supported.find((u) => u === user.githubUsername)) {
      setSupported(supported.filter((u) => u !== user.githubUsername))
    } else {
      setSupported([...supported, user.githubUsername])
      setOpposed(opposed.filter((u) => u !== user.githubUsername))
      setNeutral(neutral.filter((u) => u !== user.githubUsername))
    }
  }
  const voteOppose = (e) => {
    e.preventDefault()
    if (opposed.find((u) => u === user.githubUsername)) {
      setOpposed(opposed.filter((u) => u !== user.githubUsername))
    } else {
      setOpposed([...opposed, user.githubUsername])
      setSupported(supported.filter((u) => u !== user.githubUsername))
      setNeutral(neutral.filter((u) => u !== user.githubUsername))
    }
  }
  const voteNeutral = (e) => {
    e.preventDefault()
    if (neutral.find((u) => u === user.githubUsername)) {
      setNeutral(neutral.filter((u) => u !== user.githubUsername))
    } else {
      setNeutral([...neutral, user.githubUsername])
      setOpposed(opposed.filter((u) => u !== user.githubUsername))
      setSupported(supported.filter((u) => u !== user.githubUsername))
    }
  }

  return (
    <Flex sx={{ gap: [2] }}>
      <Box sx={{ flex: 1, textAlign: "center" }}>
        <Button
          variant="primary"
          sx={{
            border: "transparent",
            color: "white",
            py: "6px",
            px: "10px",
            width: "100%",
            fontSize: "0.98em",
            fontWeight: 500,
            bg: "mediumGreen",
            "&:hover": { bg: "mediumGreenActive" },
            mr: "8px",
          }}
          onClick={voteSupport}
        >
          Support
        </Button>
        <Box sx={{ fontSize: "0.94em", mt: [2] }}>{supported.length} supporting</Box>
      </Box>
      <Box sx={{ flex: 1, textAlign: "center" }}>
        <Button
          variant="primary"
          sx={{
            border: "transparent",
            color: "white",
            py: "6px",
            px: "10px",
            width: "100%",
            fontSize: "0.98em",
            fontWeight: 500,
            bg: "mediumRed",
            "&:hover": { bg: "mediumRedActive" },
          }}
          onClick={voteOppose}
        >
          Oppose
        </Button>
        <Box sx={{ fontSize: "0.94em", mt: [2] }}>{opposed.length} against</Box>
      </Box>
      <Box sx={{ flex: 1, textAlign: "center" }}>
        <Button
          variant="primary"
          sx={{
            border: "transparent",
            color: "white",
            py: "6px",
            px: "10px",
            width: "100%",
            fontSize: "0.98em",
            fontWeight: 500,
            bg: "mediumGray",
            "&:hover": { bg: "mediumGrayActive" },
          }}
          onClick={voteNeutral}
        >
          Neutral
        </Button>
        <Box sx={{ fontSize: "0.94em", mt: [2] }}>{neutral.length} neutral</Box>
      </Box>
    </Flex>
  )
}
