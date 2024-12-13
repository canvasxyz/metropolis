import React, { useEffect } from "react"
import { Link as RouterLink } from "react-router-dom"
import { Heading, Box, Grid, Flex, Text, Link, Button } from "@radix-ui/themes"

const GridCell = (({ children, bottom }: { children: React.ReactNode; bottom?: boolean }) => {
  if(bottom) {
    return <Box
      pt="14px"
      pb="12px"
      style={{
        borderTop: "1px solid",
        borderBottom: "1px solid",
        borderColor: "lighterGray",
        lineHeight: 1.35,
      }}>
        {children}
      </Box>
  } else {
    return <Box
      pt="14px"
      pb="4px"
      style={{
        borderTop: "1px solid",
        borderColor: "lighterGray",
        lineHeight: 1.35,
      }}>
        {children}
      </Box>
  }
})

const Index = ({ user }: { user? }) => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const samples = [
    "The proposal to upgrade sector storage seems ready for launch.",
    "We should consider using Matrix and Element for giving the community a place to discuss governance issues. Their values around decentralization line up well with ours, and lots of other platforms use them.",
    "I'm personally overwhelmed by the number of governance platforms that I have to keep up with. It would be easier to continue to use Github discussions.",
  ]

  return (
    <React.Fragment>
      <Grid columns="2">
        <Box>
          <Box flexBasis="3" maxWidth={{initial: "none", sm: "26em"}} pr="3">
            <Flex direction="row" gap="2" mt={{initial: "6", sm: "9"}}>
              <img
                src="/foundation.png"
                height="20"
                width="20"
                style={{ position: "relative", top: 2, opacity: 0.81 }}
              />
              <Text weight="bold">Fil Poll</Text>
            </Flex>
            <Heading
              size="8"
              mt="4"
              mb="4"
              style={{
                lineHeight: 1.2,
              }}
            >
              The collaborative consensus engine
            </Heading>
            <Text my="3">
              Fil Poll is a tool for groups to identify shared opinions, beliefs, and ideas, using
              collaborative polling and advanced statistics.
            </Text>
            <Box mt="4">
              <Button asChild color="gray" highContrast mr="2" style={{lineHeight: 3}}>
                <RouterLink to="/dashboard">
                  Go to app
                </RouterLink>
              </Button>
              {!user?.email && !user?.githubUserId && !user?.xInfo && (
                <Button asChild color="gray" highContrast mr="2" style={{lineHeight: 3}}>
                  <Link
                    href={`/api/v3/github_oauth_init?dest=${window.location.href}`}
                  >
                    Sign in with Github
                  </Link>
                </Button>
              )}
            </Box>
          </Box>
        </Box>
        <Box
          display={{initial: "none", sm: "block"}}
          mt="7"
          pt="10px"
          mr={{initial: "0", lg: "-20px"}}
          pl="3"
        >
          {samples.map((sample, index) => (
            <Box
              key={index}
              px="30px"
              pt="24px"
              pb="24px"
              mb="2px"
              style={{
                backgroundColor: "#faf7f2",

                boxShadow: "1px 2px 4px 0 rgba(0,0,0,0.20)",
                borderRadius: "2px",
              }}
            >
              <Text color="gray"
                >
              {sample}
              </Text>

              <Flex position="relative" width="200px" mt="3">
                <Box
                  height="4px"
                  width="28%"
                  style={{
                    backgroundColor: "#7fc782",
                  }}></Box>
                <Box
                  height="4px"
                  width="18%"
                  style={{
                    backgroundColor: "#c75f4c",
                  }}></Box>
                <Box
                  height="4px"
                  width="33%"
                  style={{
                    backgroundColor: "#c9c5bb",
                  }}></Box>
              </Flex>
            </Box>
          ))}
        </Box>
      </Grid>
      <Box maxWidth="34em" mt="4" mx="auto">
        <Box pb="4">
          <Heading as="h3">
            Ask any question
          </Heading>
        </Box>
        <Grid gap="2" columns={{initial: "2", sm: "1fr 2fr"}}>
          <GridCell>Learn about members</GridCell>
          <GridCell>“What makes you excited to be in this community?’’</GridCell>

          <GridCell>Collect feedback</GridCell>
          <GridCell>“How could we improve our user interface?’’</GridCell>

          <GridCell>Set priorities</GridCell>
          <GridCell>“Which initiatives should we focus on this year?’’</GridCell>

          <GridCell bottom>Delegation support</GridCell>
          <GridCell bottom>“As a delegate, who do you represent? What perspectives do you bring to the table, and
          what kinds of proposals would you like to support?’’</GridCell>
        </Grid>
      </Box>
      <Box maxWidth="34em" m="auto" mt="9">
        <Heading as="h3">How it works</Heading>
        <p>1. The survey creator asks a question, seeding it with 10-15 suggested responses.</p>
        <p>
          2. Participants vote on responses, contributing their own additions. The survey
          prioritizes which ones to show in realtime.
        </p>
        <p>
          3. We generate a report of top responses, key opinion groups, areas of consensus, and
          points of further exploration.
        </p>
      </Box>
      <Box maxWidth="34em" mx="auto" mt="9" mb="8">
        <Heading as="h3">Background</Heading>
        <p>
          Fil Poll is an extended version of{" "}
          <Link
            href="https://forum.effectivealtruism.org/posts/9jxBki5YbS7XTnyQy/polis-why-and-how-to-use-it"
            target="_blank"
            noreferrer="noreferrer"
            noopener="noopener"
          >
            Polis
          </Link>
          , an academically validated collective-response survey used with groups of 200,000+ by
          governments and independent media.
        </p>
        <p>
          Polis is typically used as a large-scale opinion poll. Fil Poll is for small communities
          that align around a shared mission.
        </p>
        <Flex mt="3" width="100%" direction="column" gap="2"align="center">
          <Button size="3" asChild color="gray" highContrast style={{ minWidth: "220px" }}>
            <Link
              href="https://gwern.net/doc/sociology/2021-small.pdf"
              target="_blank"
              noreferrer="noreferrer"
              noopener="noopener"
            >
              Read the Polis paper
            </Link>
          </Button>
          <Button size="3" asChild color="gray" highContrast style={{ minWidth: "220px" }}>
            <Link
              href="https://compdemocracy.org/Case-studies/"
              target="_blank"
              noreferrer="noreferrer"
              noopener="noopener"
            >
              Polis case studies
            </Link>
          </Button>
        </Flex>
      </Box>
    </React.Fragment>
  )
}

export default Index
