/** @jsx jsx */

import React, { useEffect } from "react"
import { Link as RouterLink } from "react-router-dom"
import { Heading, Box, Grid, Flex, Text, Table, Button, Link, jsx } from "theme-ui"

const Index: React.FC<{ user? }> = ({ user }) => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const grid = {
    borderTop: "1px solid",
    borderColor: "lighterGray",
    pt: "14px",
    pb: "4px",
    lineHeight: 1.35,
  }

  const comingSoon = {
    py: 4,
    width: "100%",
    textAlign: "center",
    color: "#777",
    bg: "#eee",
    borderRadius: "8px",
  }

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
                mt: [2, 8],
                mb: [3],
                maxWidth: "20em",
                fontWeight: "500",
              }}
            >
              Self-organizing network governance
            </Heading>
            <Text sx={{ my: 3 }}>
              Metropolis is a governance tool for community members to{" "}
              <Text sx={{ display: "inline", color: "#5663e2" }}>learn about each other</Text>,{" "}
              <Text sx={{ display: "inline", color: "#ea4a4b" }}>explore new ideas</Text>, and{" "}
              <Text sx={{ display: "inline", color: "#80b60c" }}>
                build a foundation for good governance
              </Text>
              .
            </Text>
            {user ? (
              <Box sx={{ mt: [6] }}>
                <RouterLink sx={{ variant: "links.button" }} to="/conversations">
                  Go to conversations
                </RouterLink>
              </Box>
            ) : (
              <Box sx={{ mt: [6] }}>
                <RouterLink sx={{ variant: "links.button" }} to="/createuser">
                  Sign up
                </RouterLink>
                <Text sx={{ display: "inline", my: [2], mx: [1], fontFamily: "monospace" }}>
                  {" "}
                  or{" "}
                </Text>
                <RouterLink sx={{ variant: "links.button" }} to="/create">
                  Preview creating a conversation
                </RouterLink>
              </Box>
            )}
          </Box>
        </Box>
        <Box sx={{ flex: 2, display: ["none", "block"] }}>
          <img
            src="/cybernetics_transparent.png"
            sx={{
              maxWidth: 250,
              mt: [7],
              ml: [null, 4, 5],
            }}
          />
        </Box>
      </Flex>
      <Box
        sx={{ my: [8], textAlign: "center", background: "#fbf5e9", py: [3], borderRadius: "4px" }}
      >
        Metropolis is still in alpha. Some functionality will change rapidly.
      </Box>
      <Box sx={{ mt: [9] }}>
        <Heading as="h3" sx={{ pb: 4 }}>
          Ask any question
        </Heading>
        <Grid gap={2} columns={[2, "1fr 2fr"]} sx={{ fontSize: "0.96em" }}>
          <Box sx={grid}>Learn about members</Box>
          <Box sx={{ ...grid, fontStyle: "italic" }}>
            “What makes you excited to be in this community?’’
          </Box>
          <Box sx={grid}>Source opportunities</Box>
          <Box sx={{ ...grid, fontStyle: "italic" }}>
            “Who would you be excited to see us collaborate with?’’
          </Box>
          <Box sx={grid}>Collect feedback</Box>
          <Box sx={{ ...grid, fontStyle: "italic" }}>
            “How could we improve our user interface?’’
          </Box>
          <Box sx={grid}>Set priorities</Box>
          <Box sx={{ ...grid, fontStyle: "italic" }}>
            “Which initiatives should we focus on this year?’’
          </Box>
          <Box sx={{ borderBottom: "1px solid", ...grid, pb: "12px" }}>
            Build representative & delegate profiles
          </Box>
          <Box sx={{ borderBottom: "1px solid", fontStyle: "italic", ...grid, pb: "12px" }}>
            “As a delegate, who do you represent, and what perspectives do you bring to the table?’’
          </Box>
        </Grid>
      </Box>
      <Box sx={{ mt: [9] }}>
        <Heading as="h3">How it works</Heading>
        <p>1. The survey creator asks a question, and seeds it with suggested responses.</p>
        <p>
          2. Participants vote on responses, while contributing their own. The survey updates in
          realtime to prioritize the highest-signal responses.
        </p>
        <p>
          3. We use statistical methods to build a detailed profile of top responses, key opinion
          groups, areas of consensus, and points of further exploration.
        </p>
      </Box>
      <Box sx={{ mt: [9] }}>
        <Heading as="h3">Background</Heading>
        <p>
          Metropolis is an extended version of{" "}
          <Link
            href="https://forum.effectivealtruism.org/posts/9jxBki5YbS7XTnyQy/polis-why-and-how-to-use-it"
            target="_blank"
            noreferrer
            noopener
          >
            Polis
          </Link>
          , an academically validated collective-response survey that has been used with groups of
          100 to 200,000 for initiatives like:
        </p>
        <p>
          <ul>
            <li>Setting ridesharing policy in Taiwan</li> 
            <li>Running citizens' assemblies in the US</li> 
            <li>Developing governance strategies for AI</li>
          </ul>
        </p>
      </Box>
      <Box sx={{ mt: [9], mb: [8] }}>
        <Heading as="h3" sx={{ mb: [4] }}>
          Coming soon
        </Heading>
        <Grid gap={[2]} columns={[2]}>
          <Box sx={comingSoon}>Token gating</Box>
          <Box sx={comingSoon}>Multi-modal surveys</Box>
          <Box sx={comingSoon}>Collect from Twitter</Box>
          <Box sx={comingSoon}>Knowledge graph</Box>
        </Grid>
      </Box>
    </React.Fragment>
  )
}

export default Index
