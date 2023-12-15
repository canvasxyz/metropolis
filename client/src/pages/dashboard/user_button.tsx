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
        px: "12px",
        py: "5px",
        fontWeight: 500,
        opacity: 0.98,
        alignItems: "center",
      }}
      href={`/api/v3/github_oauth_init?dest=${window.location.href}`}
    >
      Github Login
    </Link>
  )
}
