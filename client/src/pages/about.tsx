/** @jsx jsx */

import React, { useEffect } from "react"
import { Heading, Box, Flex, Text, jsx } from "theme-ui"

const About = () => {
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
        About Fil Poll
      </Heading>
      <Flex sx={{ display: ["block", null, "flex"], mb: [4, null, 5] }}>
        <Box sx={{ maxWidth: [null, null, 500] }}>
          <Text sx={{ mt: [2], mb: [2] }}>
            Fil Poll is a self-organizing survey and network governance tool.
          </Text>
          <Text sx={{ mt: [4], mb: [2], fontWeight: "bold" }}>Where can I see the code?</Text>
          <Text sx={{ my: [2] }}>
            Development happens on{" "}
            <a
              sx={{ variant: "styles.a" }}
              href="https://github.com/raykyri/polis"
              target="_blank"
              rel="noreferrer"
            >
              Github
            </a>{" "}
            and the project is open source, under the AGPL.
          </Text>
          <Text sx={{ my: [2] }}>
            If you encounter any bugs or issues, have ideas, or would like to contribute, please
            feel free to open an issue or pull request.
          </Text>
        </Box>
        <Box sx={{ mt: [7, null, 4], ml: [null, null, 5], textAlign: "center", flex: 1 }}>
          <img src="./foundation.svg" width="160" />
        </Box>
      </Flex>
    </React.Fragment>
  )
}

export default About
