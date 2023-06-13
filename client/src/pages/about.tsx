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
          mt: [2, 5],
          mb: [5],
          maxWidth: "20em",
          width: ["90vw", null],
        }}
      >
        About Polis+
      </Heading>
      <Box sx={{ maxWidth: 500, mb: [5] }}>
        <Text sx={{ mt: [4], mb: [2] }}>
          Polis+ is a collaborative intelligence tool for open-ended discussions and decisions. It’s
          also a new frontend to a platform that has been used to host citizens’ assemblies and
          deliberations around the world.
        </Text>
        <Text sx={{ mt: [4], mb: [2], fontWeight: "bold" }}>How is Polis+ developed?</Text>
        <Text sx={{ my: [2] }}>
          The original platform was developed by the{" "}
          <a
            sx={{ variant: "styles.a" }}
            href="https://compdemocracy.org/"
            target="_blank"
            noreferrer="noreferrer"
          >
            Computational Democracy Project
          </a>
          , a nonprofit that has been developing Polis since 2012. The CDP also maintains a
          knowledge base of best practices and case studies about Polis &mdash; check them out!
        </Text>
        <Text sx={{ my: [2] }}>
          The Polis+ project was started to create a friendlier interface to Polis in early 2023.
        </Text>
        <Text sx={{ my: [2] }}>
          Today, its development is led by members of the{" "}
          <a
            sx={{ variant: "styles.a" }}
            href="https://canvas.xyz/"
            target="_blank"
            noreferrer="noreferrer"
          >
            Canvas
          </a>{" "}
          peer-to-peer computing project, with significant input from friends at the{" "}
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
    </React.Fragment>
  )
}

export default About
