/** @jsx jsx */

import React, { Suspense, useEffect, useState } from "react"
import { Link as RouterLink, useLocation } from "react-router-dom"
import { Route as CompatRoute, Routes as CompatRoutes } from "react-router-dom-v5-compat"
import { Box, Flex, Text, jsx } from "theme-ui"
import { toast } from "react-hot-toast"

import api from "../../util/api"
import { User } from "../../util/types"
import { CreateConversationModal } from "../CreateConversationModal"
import { DashboardUserButton } from "./user_button"
import ConversationsList from "./conversations_list"
import { Placeholder } from "./placeholder"
import { DashboardConversation } from "./conversation"
import { SentimentChecks } from "./sentiment_checks"
const FipTracker = React.lazy(() => import("./fip_tracker/index.js"))

const LogoBlock = () => {
  return (
    <React.Fragment>
      <img
        src="/filecoin.png"
        width="25"
        height="25"
        sx={{
          position: "relative",
          top: "6px",
          mr: [2],
        }}
      />
      <Text
        variant="links.text"
        sx={{
          color: "text",
          "&:hover": { color: "text" },
          fontWeight: 700,
          display: "inline",
        }}
      >
        Metropolis
      </Text>
    </React.Fragment>
  )
}

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

  const [createConversationModalIsOpen, setCreateConversationModalIsOpen] = useState(false)
  const [syncInProgress, setSyncInProgress] = useState(false)
  const syncPRs = () => {
    // github sync
    setSyncInProgress(true)
    toast.success("Connecting to Github...")
    api
      .post("api/v3/github_sync", {})
      .then(({ existingFips, openPulls, fipsUpdated, fipsCreated }) => {
        toast.success(`Downloading ${existingFips} FIPs, ${openPulls} open PRs...`)
        setTimeout(() => {
          toast.success(`Updating ${fipsUpdated} FIPs, creating ${fipsCreated} new FIPs...`)
          setTimeout(() => {
            document.location.reload()
          }, 2000)
        }, 2000)
      })
      .fail((error) => {
        toast.error("Sync error")
        console.error(error)
      })
      .always(() => {
        setSyncInProgress(false)
      })
  }

  return (
    <Box sx={{ height: "100vh" }}>
      <Flex sx={{ display: "flex", height: "100%" }}>
        <Box
          sx={{
            display: mobileMenuOpen ? null : ["none", "block"],
            width: ["100%", "40%", null, "340px"],
            borderRight: "1px solid #e2ddd5",
            bg: "#FFFFFF",
            maxHeight: "100vh",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Flex
            sx={{
              width: "100%",
              borderBottom: "1px solid #e2ddd5",
              pt: "7px",
              pb: "14px",
              px: "18px",
              alignItems: "center",
              whiteSpace: "nowrap",
            }}
          >
            <Box sx={{ flexGrow: "1" }}>
              <RouterLink to="/dashboard">
                <LogoBlock />
              </RouterLink>
            </Box>
          </Flex>
          <ConversationsList
            setCreateConversationModalIsOpen={setCreateConversationModalIsOpen}
            syncPRs={syncPRs}
            syncInProgress={syncInProgress}
            user={user}
          />
        </Box>
        <Box
          sx={{
            display: [mobileMenuOpen ? "none" : "block", "block"],
            overflowY: "scroll",
            flex: 1,
            position: "relative",
            bg: "#F9F9FB",
          }}
        >
          <Box
            sx={{ display: ["block", "none"], position: "fixed", top: [2], left: "18px" }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <LogoBlock />
          </Box>
          <DashboardUserButton />
          <CompatRoutes>
            <CompatRoute path="/" element={<Placeholder />} />
            <CompatRoute path="/sentiment_checks" element={<SentimentChecks />} />
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
      <CreateConversationModal
        isOpen={createConversationModalIsOpen}
        setIsOpen={setCreateConversationModalIsOpen}
      />
    </Box>
  )
}

export default Dashboard
