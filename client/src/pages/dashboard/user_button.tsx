import React from "react"

import { useAppSelector } from "../../hooks"
import { RootState } from "../../store"
import { useHistory } from "react-router-dom"
import { Box, Button, Text } from "@radix-ui/themes"

export const TopRightFloating = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box position="absolute" top="3" right="3">
      {children}
    </Box>
  )
}

export const DashboardUserButton = () => {
  const { loading, user, isLoggedIn } = useAppSelector((state: RootState) => state.user)
  const hist = useHistory()

  if (loading) {
    return null
  }

  return (
    <TopRightFloating>
      {isLoggedIn ? (
        <Button
          color="gold"
          variant="surface"
          radius="large"
          onClick={() => hist.push(`/account`)}
          style={{ cursor: "pointer" }}
        >
          <Text sx={{ display: "inline-block" }}>
            {user.email || user.githubUsername || "View Account"}
          </Text>
        </Button>
      ) : (
        <Button
          color="gray"
          variant="solid"
          radius="large"
          highContrast
          onClick={() => {
            document.location = `/api/v3/github_oauth_init?dest=${window.location.href}`
          }}
          style={{ cursor: "pointer" }}
        >
          Sign in with Github
        </Button>
      )}
    </TopRightFloating>
  )
}
