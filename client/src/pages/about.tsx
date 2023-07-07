/** @jsx jsx */

import React, { useEffect } from "react"
import { Link } from "react-router-dom"
import { Heading, Box, Flex, Text, Button, jsx } from "theme-ui"

const About: React.FC<{ user? }> = ({ user }) => {
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
          mt: [2, null, 5],
          mb: [4, null, 5],
        }}
      >
        About PubHub
      </Heading>
      <Flex sx={{ display: ["block", null, "flex"], mb: [4, null, 5] }}>
        <Box sx={{ maxWidth: [null, null, 500] }}>
          <Text sx={{ mt: [4], mb: [2] }}>
            PubHub is a tool for open-ended discussions and decisions.
          </Text>
          <Text sx={{ mt: [4], mb: [2], fontWeight: "bold" }}>What is Public House?</Text>
          <Text sx={{ my: [2] }}>
            PubHub was started as a friendly interface to{" "}
            <a
              sx={{ variant: "styles.a" }}
              href="https://compdemocracy.org/"
              target="_blank"
              noreferrer="noreferrer"
            >
              Polis
            </a>{" "}
            in early 2023 by members of the{" "}
            <a
              sx={{ variant: "styles.a" }}
              href="https://canvas.xyz/"
              target="_blank"
              noreferrer="noreferrer"
            >
              Canvas
            </a>{" "}
            peer-to-peer computing project with friends at the{" "}
            <a
              sx={{ variant: "styles.a" }}
              href="https://cip.org/"
              target="_blank"
              noreferrer="noreferrer"
            >
              Collective Intelligence Project
            </a>
            .
          </Text>
          <Text sx={{ my: [2] }}>
            We are exploring some new ways to use AI to enable new kinds of interactions! Stay tuned
            for more details.
          </Text>
          <Text sx={{ mt: [4], mb: [2], fontWeight: "bold" }}>Where can I see the code?</Text>
          <Text sx={{ my: [2] }}>
            Development happens in public on{" "}
            <a sx={{ variant: "styles.a" }} href="https://github.com/raykyri/polis" target="_blank">
              Github
            </a>
            . If you encounter any bugs or issues, have ideas, or would like to make a contribution,
            please feel free to open an issue or pull request.
          </Text>
        </Box>
        <Box sx={{ mt: [7, null, 4], ml: [null, null, 5], textAlign: "center", flex: 1 }}>
          <img src="./conversation_bear.png" width="160" />
        </Box>
      </Flex>
    </React.Fragment>
  )
}

export default About
