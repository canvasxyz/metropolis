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
        <Text>{user.email || user.githubUsername || "View Account"}</Text>
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
