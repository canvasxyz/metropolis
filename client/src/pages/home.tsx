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
        Tools for collective meaning
      </Heading>
      <Flex sx={{ mb: [4, null, 5] }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Text sx={{ my: 3 }}>
              Polis+ is a collaborative intelligence tool, for groups to explore their knowledge and
              opinion space around a domain in realtime.
            </Text>
            <Text sx={{ my: 3 }}>
              Starting from a prompt, participants write and vote on each others’ comments.
              Statistical methods are used to identify points of agreement and disagreement.
            </Text>
            <Text sx={{ my: 3 }}>
              This tool is an extended version of Polis, created by the{" "}
              <a
                sx={{ variant: "styles.a" }}
                href="https://compdemocracy.org/"
                target="_blank"
                noreferrer="noreferrer"
                noopener="noopener"
              >
                Computational Democracy Project
              </a>{" "}
              and used by governments, academics, and citizens around the world.
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
        <Box sx={{ flex: 1, display: ["none", "block"] }}>
          <img
            src="/cybernetics.png"
            sx={{
              maxWidth: 300,
              mt: [4],
              mx: [null, 4, 6],
            }}
          />
        </Box>
      </Flex>
    </React.Fragment>
  )
}

export default Index
