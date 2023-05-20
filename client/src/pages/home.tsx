import React from "react"
import { Heading, Box, Text, Link, Button } from "theme-ui"

const Index: React.FC<{ user? }> = ({ user }) => {
  return (
    <React.Fragment>
      <Heading
        as="h1"
        sx={{
          fontSize: [5],
          lineHeight: 1.2,
          mb: [4],
          maxWidth: "20em",
        }}
      >
        An open-source platform for collaborative intelligence
      </Heading>
      <Box sx={{ mb: [4, null, 5] }}>
        <Text sx={{ my: 3 }}>
          Polis is a tool for gathering and understanding what a group thinks, and a social platform
          for ideas. Starting from a prompt, you can contribute and vote on cards that map out the
          space around a topic, and explore it with a team, group, or public community.
        </Text>
        <Text sx={{ my: 3 }}>
          Based on a platform developed by the Computational Democracy Project and used by
          governments, academics, and citizens around the world.
        </Text>
        {user ? (
          <Box sx={{ mt: [6] }}>
            <Link variant="links.button" href="/conversations">
              Go to conversations
            </Link>
          </Box>
        ) : (
          <Box sx={{ mt: [6] }}>
            <Link variant="links.button" href="/createuser">
              Sign up
            </Link>
            <Text sx={{ display: "inline", my: [2], fontFamily: "monospace" }}> or </Text>
            <Link variant="links.button" href="/signin">
              Sign in
            </Link>
          </Box>
        )}
      </Box>
    </React.Fragment>
  )
}

export default Index
