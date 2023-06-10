/** @jsx jsx */

import React from "react"
import { Link } from "react-router-dom"
import { Heading, Box, Text, Button, jsx } from "theme-ui"

const Index: React.FC<{ user? }> = ({ user }) => {
  return (
    <React.Fragment>
      <Heading
        as="h1"
        sx={{
          fontSize: [5],
          lineHeight: 1.2,
          mt: [2, 5],
          mb: [5],
          maxWidth: "20em",
        }}
      >
        Tools for collective meaning
      </Heading>
      <Box sx={{ mb: [4, null, 5] }}>
        <Text sx={{ my: 3 }}>
          Polis+ is a tool for collaborative intelligence, that allows groups to explore their
          knowledge and opinion space around a domain, in realtime.
        </Text>
        <Text sx={{ my: 3 }}>
          Starting from a prompt, participants write comments and vote on each others’ comments.
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
            <Link sx={{ variant: "links.button" }} to="/conversations">
              Go to conversations
            </Link>
          </Box>
        ) : (
          <Box sx={{ mt: [6] }}>
            <Link sx={{ variant: "links.button" }} to="/createuser">
              Sign up
            </Link>
            <Text sx={{ display: "inline", my: [2], mx: [1], fontFamily: "monospace" }}> or </Text>
            <Link sx={{ variant: "links.button" }} to="/signin">
              Sign in
            </Link>
          </Box>
        )}
      </Box>
    </React.Fragment>
  )
}

export default Index
