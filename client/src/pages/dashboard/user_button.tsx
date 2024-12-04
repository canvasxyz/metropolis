import React from "react"

import { useAppSelector } from "../../hooks"
import { RootState } from "../../store"
import { useHistory } from "react-router-dom"
import { Box, Button, Text } from "@radix-ui/themes"

export const TopRightFloating = ({children}: {children: React.ReactNode}) => {
  return <Box
    position="absolute"
    top="3"
    right="3"
    >
    {children}
  </Box>
}


export const DashboardUserButton = () => {
  const { loading, user, isLoggedIn } = useAppSelector((state: RootState) => state.user)
  const hist = useHistory()

  if (loading) {
    return null
  }

    return <TopRightFloating>
      {
        isLoggedIn
        ? <Button
            color="gold"
            variant="surface"
            onClick={() => hist.push(`/account`)}
          >
            <Text sx={{ display: "inline-block" }}>
              {user.email || user.githubUsername || "View Account"}
            </Text>
          </Button>
        : <Button
            // TODO: what is the idiomatic radix UI way to make this black?
            color="gray"
            variant="solid"
            onClick={() => {
                document.location = `/api/v3/github_oauth_init?dest=${window.location.href}`
            }}
          >
            Sign in with Github
          </Button>
      }
    </TopRightFloating>
}
