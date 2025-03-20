/** @jsx jsx */

import React, { Suspense, useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { Route as CompatRoute, Routes as CompatRoutes } from "react-router-dom-v5-compat"
import { TbMenu2 } from "react-icons/tb"
import { Box, Flex } from "@radix-ui/themes"
import { jsx } from "theme-ui"

import { User } from "../../util/types"
import { DashboardUserButton } from "./user_button"
import { LandingPage } from "./landing_page"
import { DashboardConversation } from "./conversation"
import Sidebar from "./sidebar"
const DiscussionPolls = React.lazy(() => import("./polls"))
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
    <Box style={{ height: "calc(100vh - 1px)" }}>
      <Flex style={{ height: "100%" }}>
        <Sidebar mobileMenuOpen={mobileMenuOpen} />
        <Box
          style={{
            overflowY: "scroll",
            flex: 1,
            position: "relative",
            background: "#F9F9FB",
          }}
        >
          <Box
            display={{ initial: 'block', sm: 'none' }}
            style={{
              position: "fixed",
              top: "16px",
              left: mobileMenuOpen ? "316px" : "16px",
              zIndex: 1000,
              cursor: "pointer",
              backgroundColor: "#3f4346",
              color: "white",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              textAlign: "center",
              paddingTop: "7px"
            }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <TbMenu2 size={23} />
          </Box>
          <DashboardUserButton />
          <CompatRoutes>
            <CompatRoute path="/" element={<LandingPage />} />
            <CompatRoute
              path="/polls"
              element={
                <Suspense>
                  {" "}
                  <DiscussionPolls only="polls" />
                </Suspense>
              }
            />
            <CompatRoute
              path="/sentiment"
              element={
                <Suspense>
                  {" "}
                  <DiscussionPolls only="sentiment" />
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
