/** @jsx jsx */

import { useEffect, useState } from "react"
import { Link as RouterLink } from "react-router-dom"
import { Box, Flex, Text, Button, jsx } from "theme-ui"
import { toast } from "react-hot-toast"

import api from "../../util/api"
import { User } from "../../util/types"
import { CreateConversationModal } from "../CreateConversationModal"
import { DashboardConversation } from "./conversation"
import { DashboardUserButton } from "./user_button"
import ConversationsList from "./conversations_list"

type DashboardProps = {
  user: User
  selectedConversationId: string | null
}

const Dashboard = ({ selectedConversationId }: DashboardProps) => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [createConversationModalIsOpen, setCreateConversationModalIsOpen] = useState(false)
  const [syncInProgress, setSyncInProgress] = useState(false)
  const syncPRs = () => {
    // github sync
    setSyncInProgress(true)
    toast.success("Getting updates from Github...")
    api
      .post("api/v3/github_sync", {})
      .then(({ existingFips, openPulls }) => {
        toast.success(`Found ${existingFips} existing FIPs, ${openPulls} new FIPs`)
        setTimeout(() => {
          location.reload()
        }, 1500)
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
    <Box sx={{ height: "calc(100vh - 7px)" }}>
      <style>{"body { border-top: 5px solid #0090ff; border-image: none; }"}</style>
      <Flex sx={{ display: "flex", height: "100%" }}>
        <Box
          sx={{
            width: ["40%", null, "310px"],
            borderRight: "1px solid #e2ddd5",
            background: "#f7f0e3",
            maxHeight: "100vh",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Flex
            sx={{
              width: "100%",
              borderBottom: "1px solid #e2ddd5",
              pt: "8px",
              pb: "15px",
              px: [4],
              alignItems: "center",
              whiteSpace: "nowrap",
            }}
          >
            <Box sx={{ flexGrow: "1" }}>
              <RouterLink to="/">
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
                  FIL Metropolis
                </Text>
              </RouterLink>
            </Box>
          </Flex>
          <ConversationsList
            selectedConversationId={selectedConversationId}
            setCreateConversationModalIsOpen={setCreateConversationModalIsOpen}
            syncPRs={syncPRs}
            syncInProgress={syncInProgress}
          />
        </Box>
        <Box sx={{ overflowY: "scroll", flex: 1, position: "relative" }}>
          <DashboardUserButton />
          {selectedConversationId ? (
            <DashboardConversation selectedConversationId={selectedConversationId} />
          ) : (
            <Flex sx={{ justifyContent: "center", alignItems: "center", height: "100%" }}>
              <Flex sx={{ margin: "auto", flexDirection: "column", alignItems: "center" }}>
                <img src="/foundation.png" height="200" style={{ opacity: 0.2 }} />
                <h3 sx={{ mt: [4], opacity: 0.4 }}>Select a survey</h3>
              </Flex>
            </Flex>
          )}
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
