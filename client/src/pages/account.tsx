import React from "react"
import { Box, Heading, Image } from "theme-ui"
import { TbExternalLink } from "react-icons/tb"
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
          sx={{
            fontSize: [5],
            lineHeight: 1.2,
            mt: [2, null, 5],
            mb: [4, null, 5],
          }}
        >
          Account
        </Heading>
        <Box sx={{ my: [1] }}>Hi {nameToDisplay}!</Box>
        <Box sx={{ my: [1] }}>
          {!user.githubUserId && <Box sx={{ my: [1] }}>Email: {user.email || "--"}</Box>}
          {user.githubUserId && (
            <Box sx={{ my: [1] }}>
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
          {!user.githubRepoCollaborator ? (
            <Box sx={{ mt: [3], opacity: 0.7, fontWeight: 600 }}>Not a FIP repo collaborator</Box>
          ) : (
            <>
              <RouterLink to="/dashboard">
                <Box
                  sx={{
                    display: "inline-block",
                    cursor: "pointer",
                    mt: [3],
                    px: [2],
                    py: [2],
                    lineHeight: 1.4,
                    fontWeight: 600,
                    bg: "bgOffWhite",
                    border: "1px solid",
                    borderRadius: "8px",
                    borderColor: "lighterGray",
                    color: "text",
                  }}
                >
                  <Image
                    src="/filecoin.png"
                    width="21"
                    height="21"
                    sx={{
                      display: "inline-block",
                      position: "relative",
                      top: "4px",
                      lineHeight: 1,
                      mt: "-2px",
                      mr: "6px",
                    }}
                  />
                  FIP repo collaborator
                </Box>
              </RouterLink>
              <Box sx={{ mt: [3], opacity: 0.7, fontWeight: 600 }}>
                Your account is authorized to moderate FIP sentiment checks & community polls.
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
