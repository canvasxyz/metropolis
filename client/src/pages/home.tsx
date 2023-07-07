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
      <Heading
        as="h1"
        sx={{
          fontSize: [5],
          lineHeight: 1.2,
          mt: [2, 5],
          mb: [3],
          maxWidth: "20em",
          width: ["90vw", null],
        }}
      >
        Collaboratively explore any topic, domain, or idea
      </Heading>
      <Flex sx={{ mb: [4, null, 5] }}>
        <Box sx={{ flex: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Text sx={{ my: 3 }}>
              PubHub is a <strong>collective intelligence tool</strong> that lets groups explore
              their knowledge and opinions around any domain.
            </Text>
            <Text sx={{ my: 3 }}>
              Participants start from a prompt, write comments, and vote on each others’ comments.
            </Text>
            <Text sx={{ my: 3 }}>
              Comments are scored for relevance, and clustered to identify groups with mutual
              agreement.
            </Text>
            <Text sx={{ my: 3 }}>
              PubHub is{" "}
              <a
                sx={{ variant: "styles.a" }}
                href="https://github.com/pubhubdevhub/pubhub"
                target="_blank"
                noreferrer="noreferrer"
              >
                fully open-source
              </a>
              , based on the{" "}
              <a
                sx={{ variant: "styles.a" }}
                href="https://github.com/compdemocracy/polis"
                target="_blank"
                noreferrer="noreferrer"
              >
                Polis democratic input system
              </a>{" "}
              used by governments, academics, and citizens around the world.
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
                <Link sx={{ variant: "links.button" }} to="/signin">
                  Sign in
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
    </React.Fragment>
  )
}

export default Index
