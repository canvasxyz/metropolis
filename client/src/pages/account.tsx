import React from "react"
import { Box, Heading } from "theme-ui"

import Spinner from "../components/spinner"
import { useAppSelector } from "../hooks"


function Account(){
  const {user, isLoggedIn} = useAppSelector((state) => state.user)

  if(isLoggedIn){
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
        <p>Hi {nameToDisplay}!</p>
        <Box>
          {
            user.githubUserId ? (
              <p>
                GitHub account: <a
                  target="_blank"
                  rel="noreferrer noopener"
                  href={`https://github.com/${user.githubUsername}`}
                >{user.githubUsername}</a>
              </p>
            ) : (
              <p>Email: {user.email || "--"}</p>
            )
          }
          Is repo collaborator: {user.isRepoCollaborator ? "Yes" : "No"}
        </Box>
      </Box>
    )
  } else {
    return <Spinner />
  }
}

export default Account
