/** @jsx jsx */

import { Fragment, useCallback, useEffect, useState } from "react"
import { useLocalStorage } from "usehooks-ts"
import { Link as RouterLink, useHistory } from "react-router-dom"
import { Heading, Box, Flex, Link, Text, Button, jsx } from "theme-ui"
import { toast } from "react-hot-toast"

import api from "../../util/api"
import { Conversation, User } from "../../util/types"
import { populateConversationsStore } from "../../actions"
import { CreateConversationModal } from "../CreateConversationModal"
import Spinner from "../../components/spinner"
import { DashboardConversation } from "./conversation"
import { RootState } from "../../store"
import { useAppDispatch, useAppSelector } from "../../hooks"

const sidebarCollapsibleHeaderStyle = {
  fontSize: "15px",
  fontWeight: "700",
  py: [2],
  px: [3],
  cursor: "pointer",
  userSelect: "none",
  "&:hover": {
    backgroundColor: "#F5EEDB",
  },
}

type ConversationListItemProps = {
  conversation: Conversation
  selectedConversationId: string | null
  navigateToConversation: (conversationId: string) => void
}

const ConversationListItemSection = ({ children }) => {
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
        conversation.conversation_id === selectedConversationId ? "#F5EEDB" : "#FBF5E9",
      "&:hover": {
        backgroundColor:
          conversation.conversation_id === selectedConversationId ? "#F5EEDB" : "#F8F2E2",
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
    <Flex sx={{ direction: "row" }}>
      <Text sx={{ color: "#84817D" }}>{conversation.participant_count} voted</Text>
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

  const {user, isLoggedIn, loading: userIsLoading} = useAppSelector((state: RootState) => state.user)

  const hist = useHistory()
  const data = useAppSelector((state: RootState) => state.conversations)
  const conversations: Array<Conversation> = data.conversations || []
  const { zid_metadata } = useAppSelector((state: RootState) => state.zid_metadata)

  const [syncInProgress, setSyncInProgress] = useState(false)

  const [showNonFIPConversations, setShowNonFIPConversations] = useLocalStorage("showNonFIP", false)
  const [showOpenFIPConversations, setShowOpenFIPConversations] = useLocalStorage("showOpen", true)
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

  return (
    <Box sx={{ height: "calc(100vh - 7px)" }}>
      <style>{"body { border-top: 5px solid #0090ff; border-image: none; }"}</style>
      <Flex sx={{ display: "flex", height: "100%" }}>
        <Box
          sx={{ overflowY: "scroll", width: ["40%", null, "340px"], borderRight: "1px solid #ddd" }}
        >
          <Flex
            sx={{
              width: "100%",
              borderBottom: "1px solid #ddd",
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
              sx={{ mt: [2], ml: [2], minWidth: "60px" }}
              onClick={() => setCreateConversationModalIsOpen(true)}
            >
              Add
            </Button>
            <Button
              variant="outlineSecondary"
              sx={{ mt: [2], ml: [2], minWidth: "60px" }}
              onClick={() => {
                // github sync
                setSyncInProgress(true)
                api
                  .post("api/v3/github_sync", {})
                  .then(() => {
                    toast.success("Sync complete")
                    setTimeout(() => {
                      location.reload()
                    }, 1000)
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
          <Box>
            <Box
              sx={sidebarCollapsibleHeaderStyle}
              onClick={() => {
                setShowNonFIPConversations(!showNonFIPConversations)
                setShowOpenFIPConversations(false)
                setShowArchivedConversations(false)
              }}
            >
              <span sx={{ display: "inline-block", width: [10] }}>
                {showNonFIPConversations ? "▾" : "▸"}
              </span>{" "}
              Non-FIPs ({nonFIPConversations.length})
            </Box>
            {showNonFIPConversations && (
              <ConversationListItemSection>
                {nonFIPConversations.map((conversation) => (
                  <ConversationListItem
                    conversation={conversation}
                    selectedConversationId={selectedConversationId}
                    navigateToConversation={navigateToConversation}
                    key={conversation.conversation_id}
                  />
                ))}
              </ConversationListItemSection>
            )}
            <Box
              sx={sidebarCollapsibleHeaderStyle}
              onClick={() => {
                setShowOpenFIPConversations(!showOpenFIPConversations)
                setShowNonFIPConversations(false)
                setShowArchivedConversations(false)
              }}
            >
              <span sx={{ display: "inline-block", width: [10] }}>
                {showOpenFIPConversations ? "▾" : "▸"}
              </span>{" "}
              FIPs ({openConversations.length})
            </Box>
            {showOpenFIPConversations && (
              <ConversationListItemSection>
                {openConversations.map((conversation) => (
                  <ConversationListItem
                    conversation={conversation}
                    selectedConversationId={selectedConversationId}
                    navigateToConversation={navigateToConversation}
                    key={conversation.conversation_id}
                  />
                ))}{" "}
              </ConversationListItemSection>
            )}
            <Box
              sx={sidebarCollapsibleHeaderStyle}
              onClick={() => {
                setShowArchivedConversations(!showArchivedConversations)
                setShowNonFIPConversations(false)
                setShowOpenFIPConversations(false)
              }}
            >
              <span sx={{ display: "inline-block", width: [10] }}>
                {showArchivedConversations ? "▾" : "▸"}
              </span>{" "}
              Archived ({archivedConversations.length})
            </Box>
            {showArchivedConversations && (
              <ConversationListItemSection>
                {archivedConversations.map((conversation) => (
                  <ConversationListItem
                    conversation={conversation}
                    selectedConversationId={selectedConversationId}
                    navigateToConversation={navigateToConversation}
                    key={conversation.conversation_id}
                  />
                ))}
              </ConversationListItemSection>
            )}
          </Box>
        </Box>
        <Box sx={{ overflowY: "scroll", flex: 1, position: "relative" }}>
          {
            !userIsLoading &&
            (user && isLoggedIn
            ? <Button
                variant="outlineSecondary"
                sx={{
                  position: "absolute",
                  top: [3],
                  right: [4],
                  alignItems: "center",
                }}
                onClick={() => hist.push(`/account`)}
              >
                <Text>{user.email || user.githubUsername || "View Account"}</Text>
              </Button>
            : <Link
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
              </Link>)
          }
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
