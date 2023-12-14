/** @jsx jsx */

import React, { useCallback, useEffect, useState } from "react"
import { useLocalStorage } from "usehooks-ts"
import { Link as RouterLink, useHistory } from "react-router-dom"
import { Box, Flex, Text, Button, jsx } from "theme-ui"
import { toast } from "react-hot-toast"

import api from "../../util/api"
import { Conversation, User } from "../../util/types"
import { populateConversationsStore } from "../../actions"
import { CreateConversationModal } from "../CreateConversationModal"
import Spinner from "../../components/spinner"
import { DashboardConversation } from "./conversation"
import { RootState } from "../../store"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { DashboardUserButton } from "./user_button"

type ConversationListItemProps = {
  conversation: Conversation
  selectedConversationId: string | null
  navigateToConversation: (conversationId: string) => void
}

const ConversationListItemSection = ({ children }: { children }) => {
  return <Box sx={{ minHeight: "calc(100vh - 190px)" }}>{children}</Box>
}

const ConversationListItem = ({
  conversation,
  selectedConversationId,
  navigateToConversation,
}: ConversationListItemProps) => (
  <Box
    sx={{
      p: [3],
      pl: [4],
      cursor: "pointer",
      userSelect: "none",
      fontSize: "15px",
      lineHeight: 1.3,
      backgroundColor:
        conversation.conversation_id === selectedConversationId ? "#ede4d1" : "inherit",
      "&:hover": {
        backgroundColor:
          conversation.conversation_id === selectedConversationId ? "#ede4d1" : "inherit",
      },
    }}
    onClick={(e) => {
      e.preventDefault()
      navigateToConversation(conversation.conversation_id)
    }}
    key={conversation.conversation_id}
  >
    <Text sx={{ fontWeight: 500 }}>
      {conversation.fip_number ? `FIP-${conversation.fip_number}: ` : ""}
      {conversation.fip_title || conversation.github_pr_title || conversation.topic || (
        <Text sx={{ color: "#84817D" }}>Untitled</Text>
      )}
    </Text>
    <Flex sx={{ direction: "row", mt: [1] }}>
      <Text sx={{ color: "#84817D", fontSize: "90%" }}>
        {conversation.fip_created && conversation.github_pr_id ? (
          <Text>
            PR #{conversation.github_pr_id} created{" "}
            {(() => {
              const date = new Date(conversation.fip_created)
              return `${date.getMonth() + 1}/${date.getUTCDate()}/${date.getFullYear()}`
            })()}
          </Text>
        ) : (
          <Text>
            Poll created{" "}
            {(() => {
              const date = new Date(conversation.created)
              return `${date.getMonth() + 1}/${date.getUTCDate()}/${date.getFullYear()}`
            })()}
          </Text>
        )}
      </Text>
    </Flex>
  </Box>
)

type DashboardProps = {
  user: User
  selectedConversationId: string | null
}

const Dashboard = ({ selectedConversationId }: DashboardProps) => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    dispatch(populateConversationsStore())
  }, [])

  const hist = useHistory()
  const data = useAppSelector((state: RootState) => state.conversations)
  const conversations: Array<Conversation> = data.conversations || []
  const { zid_metadata } = useAppSelector((state: RootState) => state.zid_metadata)

  const [syncInProgress, setSyncInProgress] = useState(false)

  const [showAllFIPConversations, setShowAllFIPConversations] = useLocalStorage("showAll", true)
  const [showOpenFIPConversations, setShowOpenFIPConversations] = useLocalStorage("showOpen", false)
  const [showNonFIPConversations, setShowNonFIPConversations] = useLocalStorage("showNonFIP", false)
  const [showArchivedConversations, setShowArchivedConversations] = useLocalStorage(
    "showArchived",
    false,
  )

  const [createConversationModalIsOpen, setCreateConversationModalIsOpen] = useState(false)

  const navigateToConversation = useCallback((conversationId) => {
    hist.push(`/dashboard/c/${conversationId}`)
  }, [])

  const selectedConversation =
    selectedConversationId !== null
      ? conversations.filter(
          (conversation) => conversation.conversation_id === selectedConversationId,
        )[0]
      : null

  const nonFIPConversations = conversations.filter(
    (conversation) => !conversation.fip_title && !conversation.is_archived,
  )
  const openConversations = conversations.filter(
    (conversation) => conversation.fip_title && !conversation.is_archived,
  )
  const archivedConversations = conversations.filter((conversation) => conversation.is_archived)
  const allConversations = openConversations.concat(nonFIPConversations)

  if (showAllFIPConversations) {
    allConversations.sort((c1, c2) => {
      return (
        (c2.github_pr_opened_at ? new Date(c2.github_pr_opened_at).getTime() : c2.created) -
        (c1.github_pr_opened_at ? new Date(c1.github_pr_opened_at).getTime() : c1.created)
      )
    })
  }

  const selectedConversations = showAllFIPConversations
    ? allConversations
    : showOpenFIPConversations
    ? openConversations
    : showNonFIPConversations
    ? nonFIPConversations
    : showArchivedConversations
    ? archivedConversations
    : []

  return (
    <Box sx={{ height: "calc(100vh - 7px)" }}>
      <style>{"body { border-top: 5px solid #0090ff; border-image: none; }"}</style>
      <Flex sx={{ display: "flex", height: "100%" }}>
        <Box
          sx={{
            overflowY: "scroll",
            width: ["40%", null, "310px"],
            borderRight: "1px solid #e2ddd5",
            background: "#f7f0e3",
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
                    display: "inlineBlock",
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
            <Button
              variant="outlineSecondary"
              sx={{ mt: [2], ml: [2], minWidth: "50px", fontSize: "0.94em" }}
              onClick={() => setCreateConversationModalIsOpen(true)}
            >
              Add
            </Button>
            <Button
              variant="outlineSecondary"
              sx={{ mt: [2], ml: [2], minWidth: "50px", fontSize: "0.94em" }}
              onClick={() => {
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
              }}
            >
              {syncInProgress ? <Spinner size={25} /> : "Sync"}
            </Button>
          </Flex>
          <Box
            sx={{
              fontSize: "15px",
              fontWeight: "500",
              py: [2],
              px: [3],
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <Box
              variant={showAllFIPConversations ? "buttons.primary" : "buttons.outline"}
              sx={{ px: [2], py: [1], mr: [1], mb: [1], display: "inline-block" }}
              onClick={() => {
                setShowAllFIPConversations(true)
                setShowNonFIPConversations(false)
                setShowOpenFIPConversations(false)
                setShowArchivedConversations(false)
              }}
            >
              All ({openConversations.length + nonFIPConversations.length})
            </Box>
            <Box
              variant={showOpenFIPConversations ? "buttons.primary" : "buttons.outline"}
              sx={{ px: [2], py: [1], mr: [1], mb: [1], display: "inline-block" }}
              onClick={() => {
                setShowOpenFIPConversations(true)
                setShowAllFIPConversations(false)
                setShowNonFIPConversations(false)
                setShowArchivedConversations(false)
              }}
            >
              FIPs ({openConversations.length})
            </Box>
            <Box
              variant={showNonFIPConversations ? "buttons.primary" : "buttons.outline"}
              sx={{ px: [2], py: [1], mr: [1], mb: [1], display: "inline-block" }}
              onClick={() => {
                setShowNonFIPConversations(true)
                setShowAllFIPConversations(false)
                setShowOpenFIPConversations(false)
                setShowArchivedConversations(false)
              }}
            >
              Community Polls ({nonFIPConversations.length})
            </Box>
            <Box
              variant={showArchivedConversations ? "buttons.primary" : "buttons.outline"}
              sx={{ px: [2], py: [1], mr: [1], mb: [1], display: "inline-block" }}
              onClick={() => {
                setShowArchivedConversations(true)
                setShowAllFIPConversations(false)
                setShowNonFIPConversations(false)
                setShowOpenFIPConversations(false)
              }}
            >
              Past {/* ({archivedConversations.length}) */}
            </Box>
          </Box>
          <ConversationListItemSection>
            {selectedConversations.map((conversation) => (
              <ConversationListItem
                conversation={conversation}
                selectedConversationId={selectedConversationId}
                navigateToConversation={navigateToConversation}
                key={conversation.conversation_id}
              />
            ))}
          </ConversationListItemSection>
        </Box>
        <Box sx={{ overflowY: "scroll", flex: 1, position: "relative" }}>
          <DashboardUserButton />
          {selectedConversation ? (
            <DashboardConversation
              conversation={selectedConversation}
              zid_metadata={zid_metadata}
            />
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
