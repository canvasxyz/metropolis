/** @jsx jsx */
import React from "react"
import { Link } from "react-router-dom"
import { Box, Text, jsx } from "theme-ui"

const Footer = ({ inSurvey }: { inSurvey: boolean }) => {
  return (
    <Box
      sx={{
        textAlign: inSurvey ? "center" : "",
        px: [4, 5],
      }}
    >
      {!inSurvey && (
        <Text as="span" sx={{ mr: 3 }}>
          &copy; {new Date().getFullYear()} Authors
        </Text>
      )}
      <Link sx={{ variant: "styles.a", mr: 3 }} to="/tos">
        Terms
      </Link>{" "}
      <Link sx={{ variant: "styles.a", mr: 3, pr: "1px" }} to="/privacy">
        Privacy
      </Link>
      {inSurvey && (
        <Link sx={{ variant: "styles.a", mr: 3 }} to="/">
          About
        </Link>
      )}
      {!inSurvey && (
        <Link sx={{ variant: "styles.a", mr: 3 }} to="/about">
          About
        </Link>
      )}
    </Box>
  )
}

export default Footer
