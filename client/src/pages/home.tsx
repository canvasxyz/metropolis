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
    lineHeight: 1.25,
    color: "#777",
    bg: "bgGray",
    borderRadius: "8px",
  }

  const samples = [
    "The level of conflict we have right now is okay. We shouldn't expect total agreement among everyone.",
    "I really like our iOS widgets. We should explore more projects like that - avatars, collectibles, and toys are fun and approachable for lots of people.",
    "It can be hard to understand why the organization works the way it does. Since governance is an important part of our legitimacy, it would help to have a writer come in and do a profile to tell our story.",
  ]

  return (
    <React.Fragment>
      <Flex sx={{ mb: [4, null, 5] }}>
        <Box sx={{ flex: 3 }}>
          <Box sx={{ flex: 1, maxWidth: ["none", "26em"], pr: [3] }}>
            <Box sx={{ mt: [6, 9], pb: [1] }}>
              <img
                src="/foundation.png"
                width="20"
                style={{ position: "relative", top: 2, opacity: 0.81 }}
              />
              <Text sx={{ display: "inline", ml: "9px", fontWeight: "700" }}>Metropolis</Text>
            </Box>
            <Heading
              as="h1"
              sx={{
                fontSize: [6],
                lineHeight: 1.2,
                mt: [4],
                mb: [4],
                maxWidth: "26em",
                fontWeight: "700",
              }}
            >
              The self-organizing collective survey
            </Heading>
            <Text sx={{ my: 3 }}>
              Metropolis is a tool for groups to identify shared opinions, beliefs, and ideas.
            </Text>
            {user ? (
              <Box sx={{ mt: [6] }}>
                <RouterLink sx={{ variant: "links.button", px: [4] }} to="/conversations">
                  Go to app
                </RouterLink>
              </Box>
            ) : (
              <Box sx={{ mt: [4] }}>
                <RouterLink sx={{ variant: "links.button", lineHeight: 3 }} to="/createuser">
                  Sign up
                </RouterLink>
                <Text sx={{ display: "inline", my: [2], mx: [2], fontFamily: "monospace" }}>
                  or
                </Text>
                <RouterLink sx={{ variant: "links.button", lineHeight: 3 }} to="/signin">
                  Sign in
                </RouterLink>
                <Text sx={{ display: "inline", my: [2], mx: [2], fontFamily: "monospace" }}>
                  or
                </Text>
                <Link
                  sx={{ variant: "links.buttonBlack", lineHeight: 3 }}
                  href="/api/v3/github_oauth_init"
                >
                  Github Login
                </Link>
              </Box>
            )}
            <Box sx={{ mt: [6, 4] }}>
              <RouterLink sx={{ variant: "links.text", fontWeight: 400 }} to="/c/65vvimnjkp">
                Try a survey
              </RouterLink>
              ,{" "}
              <RouterLink sx={{ variant: "links.text", fontWeight: 400 }} to="/create">
                create a survey
              </RouterLink>
              , or{" "}
              <RouterLink
                sx={{ variant: "links.text", fontWeight: 400 }}
                to="/r/65vvimnjkp/r8zmxnjabtcz8daf9hjrk"
              >
                read a report
              </RouterLink>
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            flex: 3,
            display: ["none", "block"],
            mt: [9],
            pt: "18px",
            mr: [0, 0, 0, "-20px"],
            pl: [3],
          }}
        >
          {samples.map((sample, index) => (
            <Box
              key={index}
              sx={{
                background: "#faf7f2",
                color: "#1f1f1f",
                fontSize: "0.91em",
                lineHeight: 1.35,
                px: "30px",
                pt: "24px",
                pb: "24px",
                mb: "2px",
                boxShadow: "1px 2px 4px 0 rgba(0,0,0,0.20)",
                borderRadius: "2px",
              }}
            >
              {sample}

              <Flex sx={{ position: "relative", width: "200px", mt: [3] }}>
                <Box sx={{ height: "4px", width: "28%", bg: "#7fc782" }}></Box>
                <Box sx={{ height: "4px", width: "18%", bg: "#c75f4c" }}></Box>
                <Box sx={{ height: "4px", width: "33%", bg: "#c9c5bb" }}></Box>
              </Flex>
            </Box>
          ))}
        </Box>
      </Flex>
      <Box
        sx={{
          mt: [9],
          mb: [8],
          textAlign: "center",
          backgroundColor: "bgGray",
          py: [3],
          px: [3],
          borderRadius: "4px",
          lineHeight: 1.3,
        }}
      >
        Metropolis is in alpha. Your data is safe, but our interfaces are still evolving rapidly.
      </Box>
      <Box sx={{ maxWidth: "34em", margin: "0 auto", mt: [9] }}>
        <Heading as="h3" sx={{ pb: 4 }}>
          Ask any question
        </Heading>
        <Grid gap={2} columns={[2, "1fr 2fr"]} sx={{ fontSize: "0.94em" }}>
          <Box sx={grid}>Learn about members</Box>
          <Box sx={{ ...grid, fontStyle: "italic" }}>
            “What makes you excited to be in this community?’’
          </Box>
          <Box sx={grid}>Collect feedback</Box>
          <Box sx={{ ...grid, fontStyle: "italic" }}>
            “How could we improve our user interface?’’
          </Box>
          <Box sx={grid}>Set priorities</Box>
          <Box sx={{ ...grid, fontStyle: "italic" }}>
            “Which initiatives should we focus on this year?’’
          </Box>
          <Box sx={{ borderBottom: "1px solid", ...grid, pb: "12px" }}>Delegation support</Box>
          <Box sx={{ borderBottom: "1px solid", fontStyle: "italic", ...grid, pb: "12px" }}>
            “As a delegate, who do you represent? What perspectives do you bring to the table, and
            what kinds of proposals would you like to support?’’
          </Box>
        </Grid>
      </Box>
      <Box sx={{ maxWidth: "34em", margin: "auto", mt: [9] }}>
        <Heading as="h3">How it works</Heading>
        <p>1. The survey creator asks a question, seeding it with 10-15 suggested responses.</p>
        <p>
          2. Participants vote on responses, contributing their own additions. The survey
          prioritizes which ones to show in realtime.
        </p>
        <p>
          3. We use statistical methods to build a profile of top responses, key opinion groups,
          areas of consensus, and points of further exploration.
        </p>
      </Box>
      <Box sx={{ maxWidth: "34em", margin: "0 auto", mt: [9] }}>
        <Heading as="h3" sx={{ mb: [4] }}>
          Coming soon
        </Heading>
        <Grid gap={[2]} columns={[2]}>
          <Box sx={comingSoon}>Advanced analysis</Box>
          <Box sx={comingSoon}>Advanced voting UI</Box>
          <Box sx={comingSoon}>Web3 login</Box>
          <Box sx={comingSoon}>Token gating</Box>
        </Grid>
      </Box>
      <Box sx={{ maxWidth: "34em", margin: "0 auto", mt: [9], mb: [8] }}>
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
          , an academically validated collective-response survey used with groups of 200,000+ by
          governments and independent media.
        </p>
        <p>
          Polis is typically used as a large-scale opinion poll. Metropolis is for small communities
          that align around a shared mission.
        </p>
        <Box sx={{ mt: [5, 6], textAlign: "center" }}>
          <Link
            sx={{
              variant: "links.button",
              display: "inline-block",
              mb: [3],
              border: "none !important",
              minWidth: "220px",
            }}
            href="https://gwern.net/doc/sociology/2021-small.pdf"
            target="_blank"
            noopener
            noreferrer
          >
            Read the Polis paper
          </Link>
          <br />
          <Link
            sx={{
              variant: "links.button",
              display: "inline-block",
              border: "none !important",
              minWidth: "220px",
            }}
            href="https://compdemocracy.org/Case-studies/"
            target="_blank"
            noopener
            noreferrer
          >
            Polis case studies
          </Link>
        </Box>
      </Box>
    </React.Fragment>
  )
}

export default Index
