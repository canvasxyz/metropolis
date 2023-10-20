/** @jsx jsx */

import React, { useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link as RouterLink, useHistory } from "react-router-dom"
import { Box, Flex, Text, Button, jsx } from "theme-ui"
import { Conversation, RootState } from "../../util/types"
import { populateConversationsStore } from "../../actions"

import { CreateConversationModal } from "../CreateConversationModal"
import ConversationInfo from "./conversation_info"


const Dashboard: React.FC<{ user?: any; selectedConversationId: string | null }> = ({ user, selectedConversationId }) => {
  const dispatch = useDispatch()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    dispatch(populateConversationsStore())
  }, [])

  const hist = useHistory()
  const data = useSelector((state: RootState) => state.conversations)
  const conversations: Array<Conversation> = data.conversations || []

  const [showOpenConversations, setShowOpenConversations] = useState(true)
  const [showArchivedConversations, setShowArchivedConversations] = useState(true)

  const [createConversationModalIsOpen, setCreateConversationModalIsOpen] = useState(false)

  const navigateToConversation = useCallback((conversationId) => {
    hist.push(`/dashboard/c/${conversationId}`);
  },[])

  const selectedConversation = selectedConversationId !== null ? conversations.filter((conversation) => conversation.conversation_id == selectedConversationId)[0] : null

  const openConversations = conversations.filter((conversation) => !conversation.is_archived)
  const archivedConversations = conversations.filter((conversation) => conversation.is_archived)

  return (
    <Box sx={{ height: "calc(100vh - 7px)" }}>
      <style>{"body { border-top: 5px solid #0090ff; border-image: none; }"}</style>
      <Flex sx={{ display: "flex", height: "100%" }}>
        <Box sx={{ overflowY:"scroll", width: ["40%", null, "340px"], borderRight: "1px solid #ddd" }}>
          <Flex sx={{ width: "100%", borderBottom: "1px solid #ddd", py: [3], px: [4], alignItems:"center" }}>
            <Box sx={{flexGrow: "1"}}>
              <RouterLink to="/">
                <Text variant="links.a" sx={{ fontWeight: 500, display: "inline" }}>
                  Metropolis
                </Text>
              </RouterLink>{" "}
              / FIPs
            </Box>

            <Button variant="outlineSecondary" onClick={() => setCreateConversationModalIsOpen(true)}>
              Add survey
            </Button>
          </Flex>
          <Box>
            <Box
              sx={{
                fontWeight: 500,
                py: [2],
                px: [3],
                cursor: "pointer",
                userSelect: "none",
                "&:hover": {
                  backgroundColor: "#F5EEDB"
                }
              }}
              onClick={() => setShowOpenConversations(!showOpenConversations)}
            >
              {showOpenConversations ? "▾" : "▸"} Open Surveys ({openConversations.length})
            </Box>
            {showOpenConversations && openConversations.map(
              (conversation) =>
              <Box
                sx={{
                  p: [3],
                  pl: [6],
                  cursor: "pointer",
                  userSelect: "none",
                  backgroundColor: conversation.conversation_id == selectedConversationId ? "#F5EEDB": "#FBF5E9",
                  "&:hover": {
                    backgroundColor: conversation.conversation_id == selectedConversationId ? "#F5EEDB" : "#F8F2E2"
                  }
                }}
                onClick={() => navigateToConversation(conversation.conversation_id)}
                key={conversation.conversation_id}
              >
                <Text sx={{fontWeight: 500}}>#{conversation.github_pr_id} - {conversation.fip_title || conversation.github_pr_title}</Text>
                <Flex sx={{direction: "row"}}>
                  <Text sx={{color: "#84817D", flexGrow:"1"}}>{conversation.fip_type}</Text>
                  <Text sx={{color: "#84817D"}}>{conversation.github_pr_submitter}</Text>
                </Flex>

              </Box>)
            }
            <Box
              sx={{
                fontWeight: 500,
                py: [2],
                px: [3],
                cursor: "pointer",
                userSelect: "none",
                "&:hover": {
                  backgroundColor: "#F5EEDB"
                }
              }}
              onClick={() => setShowArchivedConversations(!showArchivedConversations)}
            >
              {showArchivedConversations ? "▾" : "▸"} Past Surveys ({archivedConversations.length})
            </Box>
            {showArchivedConversations && archivedConversations.map(
              (conversation) =>
              <Box
                sx={{
                  fontWeight: 500,
                  p: [3],
                  pl: [6],
                  cursor: "pointer",
                  userSelect: "none",
                  backgroundColor: conversation.conversation_id == selectedConversationId ? "#F5EEDB": "#FBF5E9",
                  "&:hover": {
                    backgroundColor: conversation.conversation_id == selectedConversationId ? "#F5EEDB" : "#F8F2E2"
                  }
                }}
                onClick={() => navigateToConversation(conversation.conversation_id)}
                key={conversation.conversation_id}
              >
                {conversation.topic}
              </Box>)
            }
          </Box>
        </Box>
        <Box sx={{ overflowY:"scroll", flex: 1 }}>
          {selectedConversation
            ? <ConversationInfo selectedConversation={selectedConversation} />
            :
              <Flex sx={{  justifyContent: "center", alignItems:"center", height: "100%"
               }}>
                <Flex sx={{margin: "auto", flexDirection: "column", alignItems: "center"}}>
                  <img
                    src="/foundation.png"
                    width="200"
                    style={{ opacity: 0.2 }}
                  />
                  <h1 sx={{mt:[1], opacity: 0.7}}>
                    Select a survey
                  </h1>
                </Flex>
              </Flex>
          }
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
