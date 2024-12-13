import React from "react"
import { Box, Heading, Text } from "@radix-ui/themes"
import { Link as RouterLink } from "react-router-dom"

import Spinner from "../components/spinner"
import { useAppSelector } from "../hooks"

function Account() {
  const { user, isLoggedIn } = useAppSelector((state) => state.user)

  if (isLoggedIn) {
    const nameToDisplay = user.hname || user.email || user.githubUsername
    return (
      <Box>
        <Heading
          as="h1"
          size="5"
          mt={{initial: "2", md: "5"}}
          mb={{initial: "4", md: "5"}}
        >
          Account
        </Heading>
        <Box my="1">Hi {nameToDisplay}!</Box>
        <Box my="1">
          {!user.githubUserId && <Box my="1">Email: {user.email || "--"}</Box>}
          {user.githubUserId && (
            <Box my="1">
              GitHub account:{" "}
              <a
                target="_blank"
                rel="noreferrer noopener"
                href={`https://github.com/${user.githubUsername}`}
              >
                {user.githubUsername}
              </a>
            </Box>
          )}
          {!user.isRepoCollaborator ? (
            <Box mt="3" style={{ opacity: 0.7}}>
              <Text weight="bold">
                Not a FIP repo collaborator
              </Text>
            </Box>
          ) : (
            <>
              <RouterLink to="/dashboard">
                <Box
                  mt="3"
                  px="2"
                  py="2"
                  style={{
                    display: "inline-block",
                    cursor: "pointer",
                    lineHeight: 1.4,
                    fontWeight: 600,
                    backgroundColor: "#faf9f6",
                    border: "1px solid",
                    borderRadius: "8px",
                    borderColor: "lighterGray",
                    color: "text",
                  }}
                >
                  <img
                    src="/filecoin.png"
                    width="21"
                    height="21"
                    style={{
                      display: "inline-block",
                      position: "relative",
                      top: "4px",
                      lineHeight: 1,
                    }}
                  />
                  FIP repo collaborator
                </Box>
              </RouterLink>
              <Box mt="3" style={{ opacity: 0.7 }}>
                <Text weight="bold">
                  Your account is authorized to moderate FIP sentiment checks & community polls.
                </Text>
              </Box>
            </>
          )}
        </Box>
      </Box>
    )
  } else {
    return <Spinner />
  }
}

export default Account
