import React from "react"
import { Link, Text, Button } from "theme-ui"

import { useAppSelector } from "../../hooks"
import { RootState } from "../../store"
import { useHistory } from "react-router-dom"

export const DashboardUserButton = () => {
  const { loading, user, isLoggedIn } = useAppSelector((state: RootState) => state.user)
  const hist = useHistory()

  if (loading) {
    return null
  }

  if (isLoggedIn) {
    return (
      <Button
        variant="outlineSecondary"
        sx={{
          position: "absolute",
          top: [3],
          right: [4],
          alignItems: "center",
          zIndex: 9999,
        }}
        onClick={() => hist.push(`/account`)}
      >
        <Text sx={{ display: "inline-block" }}>
          {user.email || user.githubUsername || "View Account"}
        </Text>
        {user.githubRepoCollaborator && (
          <Text
            sx={{
              display: "inline-block",
              fontSize: "0.88em",
              opacity: 0.7,
              fontWeight: 600,
              ml: "6px",
              mr: "3px",
            }}
          >
            [Mod]
          </Text>
        )}
      </Button>
    )
  }

  return (
    <Link
      variant="links.buttonBlack"
      sx={{
        position: "absolute",
        top: [3],
        right: [4],
        alignItems: "center",
      }}
      href={`/api/v3/github_oauth_init?dest=${window.location.href}`}
    >
      Github Login
    </Link>
  )
}
