/** @jsx jsx */

import React from "react"
import { Button, Heading, Link, Box, Flex, Text, jsx } from "theme-ui"
import { Link as RouterLink, useHistory } from "react-router-dom"

export const SentimentCheck: React.FC<{}> = () => {
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
        >
          Support
        </Button>
        <Box sx={{ fontSize: "0.94em", mt: [2] }}>0 voted support</Box>
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
        >
          Oppose
        </Button>
        <Box sx={{ fontSize: "0.94em", mt: [2] }}>0 voted against</Box>
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
        >
          Neutral
        </Button>
        <Box sx={{ fontSize: "0.94em", mt: [2] }}>0 voted neutral</Box>
      </Box>
    </Flex>
  )
}
