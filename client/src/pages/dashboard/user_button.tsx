import React from "react"
import { Text, Button } from "theme-ui"

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
          top: ["10px", "12px"],
          right: ["14px", "18px"],
          alignItems: "center",
          zIndex: 1,
        }}
        onClick={() => hist.push(`/account`)}
      >
        <Text sx={{ display: "inline-block" }}>
          {user.email || user.githubUsername || "View Account"}
        </Text>
      </Button>
    )
  }
}
