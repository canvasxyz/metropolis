/** @jsx jsx */

import React, { Suspense, useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { Route as CompatRoute, Routes as CompatRoutes } from "react-router-dom-v5-compat"
import { Box, Flex, jsx } from "theme-ui"

import { User } from "../../util/types"
import { DashboardUserButton } from "./user_button"
import { LandingPage } from "./landing_page"
import { DashboardConversation } from "./conversation"
import Sidebar from "./sidebar"
const SentimentChecks = React.lazy(() => import("./sentiment_checks"))
const FipTracker = React.lazy(() => import("./fip_tracker/index.js"))

type DashboardProps = {
  user: User
}

const Dashboard = ({ user }: DashboardProps) => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  return (
    <Box sx={{ height: "calc(100vh - 1px)" }}>
      <Flex sx={{ display: "flex", height: "100%" }}>
        <Sidebar mobileMenuOpen={mobileMenuOpen} />
        <Box
          sx={{
            display: [mobileMenuOpen ? "none" : "block", "block"],
            overflowY: "scroll",
            flex: 1,
            position: "relative",
            bg: "#F9F9FB",
          }}
        >
          <DashboardUserButton />
          <CompatRoutes>
            <CompatRoute path="/" element={<LandingPage />} />
            <CompatRoute
              path="/sentiment_checks"
              element={
                <Suspense>
                  {" "}
                  <SentimentChecks />
                </Suspense>
              }
            />
            <CompatRoute
              path="/fip_tracker"
              element={
                <Suspense>
                  {" "}
                  <FipTracker />
                </Suspense>
              }
            />
            <CompatRoute
              path="/c/:conversation_id"
              element={<DashboardConversation user={user} />}
            />
          </CompatRoutes>
        </Box>
      </Flex>
    </Box>
  )
}

export default Dashboard
