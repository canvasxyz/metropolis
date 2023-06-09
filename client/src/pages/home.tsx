/** @jsx jsx */

import React from "react"
import { Heading, Box, Text, Link, Button, jsx } from "theme-ui"

const Index: React.FC<{ user? }> = ({ user }) => {
  return (
    <React.Fragment>
      <Heading
        as="h1"
        sx={{
          fontSize: [5],
          lineHeight: 1.2,
          my: [5],
          maxWidth: "20em",
        }}
      >
        Tools for collective meaning
      </Heading>
      <Box sx={{ mb: [4, null, 5] }}>
        <Text sx={{ my: 3 }}>
          Polis+ is a tool for collaborative intelligence, that allows groups to quickly and
          effectively explore their knowledge and opinion space around a domain.
        </Text>
        <Text sx={{ my: 3 }}>
          Starting from a prompt, members write comments and vote on each others' comments.
          Statistical methods are used to identify the most important comments, and points of
          agreement and disagreement within the group.
        </Text>
        <Text sx={{ my: 3 }}>
          The tool is an extended version of{" "}
          <a href="https://github.com/compdemocracy/polis">Polis</a>, created by the Computational
          Democracy Project and used by governments, academics, and citizens around the world.
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
            <Text sx={{ display: "inline", my: [2], mx: [1], fontFamily: "monospace" }}> or </Text>
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
