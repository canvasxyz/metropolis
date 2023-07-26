/** @jsx jsx */

import React, { useEffect } from "react"
import { Link } from "react-router-dom"
import { Heading, Box, Flex, Text, Button, jsx } from "theme-ui"

const Index: React.FC<{ user? }> = ({ user }) => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <React.Fragment>
      <Flex sx={{ mb: [4, null, 5] }}>
        <Box sx={{ flex: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Heading
              as="h1"
              sx={{
                fontSize: [5],
                lineHeight: 1.2,
                mt: [2, 5],
                mb: [3],
                maxWidth: "20em",
              }}
            >
              Self-organizing network governance
            </Heading>
            <Text sx={{ my: 3 }}>
              Quest is a governance tool for community members to{" "}
              <Text sx={{ display: "inline", color: "#5663e2" }}>learn about each other</Text>,{" "}
              <Text sx={{ display: "inline", color: "#ea4a4b" }}>explore new ideas</Text>, and{" "}
              <Text sx={{ display: "inline", color: "#80b60c" }}>
                build a foundation for good governance
              </Text>
              .
            </Text>
            {user ? (
              <Box sx={{ mt: [6] }}>
                <Link sx={{ variant: "links.button" }} to="/conversations">
                  Go to conversations
                </Link>
              </Box>
            ) : (
              <Box sx={{ mt: [6] }}>
                <Link sx={{ variant: "links.button" }} to="/createuser">
                  Sign up
                </Link>
                <Text sx={{ display: "inline", my: [2], mx: [1], fontFamily: "monospace" }}>
                  {" "}
                  or{" "}
                </Text>
                <Link sx={{ variant: "links.button" }} to="/create">
                  Preview creating a conversation
                </Link>
              </Box>
            )}
          </Box>
        </Box>
        <Box sx={{ flex: 2, display: ["none", "block"] }}>
          <img
            src="/cybernetics_transparent.png"
            sx={{
              maxWidth: 250,
              mt: [4],
              ml: [null, 4, 5],
            }}
          />
        </Box>
      </Flex>
      <Box sx={{ mt: [9] }}>
        <Heading as="h3">How it works</Heading>
        <p>1. The survey creator asks a question, and seeds it with suggested responses.</p>
        <p>
          2. Participants vote on responses, while contributing their own. The survey updates in
          realtime to prioritize the best responses.
        </p>
        <p>
          3. We use statistical methods to build a detailed profile of the community, identifying
          key opinion groups, points of consensus, and points of further exploration.
        </p>
        <p>
          4. Data contributed can be used to build member directories, delegate profiles, working
          groups, and more.
        </p>
      </Box>
      <Box sx={{ mt: [9], mb: [8] }}>
        <Heading as="h3">Background</Heading>
        <p>
          Quest is a user-friendly rewrite of Polis, an academically validated collective-response
          survey that has been used with groups of 100 to over 200,000.
        </p>
      </Box>
    </React.Fragment>
  )
}

export default Index
