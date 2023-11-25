/** @jsx jsx */

import { Fragment, useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link as RouterLink, useHistory } from "react-router-dom"
import { Heading, Box, Flex, Text, Button, jsx } from "theme-ui"
import { toast } from "react-hot-toast"
import remarkGfm from "remark-gfm"
import ReactMarkdown from "react-markdown"
import { TbSettings } from "react-icons/tb"

import api from "../util/api"
import { Conversation, RootState, User } from "../util/types"
import { populateConversationsStore } from "../actions"
import { Frontmatter } from "./Frontmatter"
import Survey from "./survey"
import { CreateConversationModal } from "./CreateConversationModal"
import Spinner from "../components/spinner"

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
    onClick={() => navigateToConversation(conversation.conversation_id)}
    key={conversation.conversation_id}
  >
    <Text sx={{ fontWeight: 500 }}>
      {conversation.fip_number && `FIP-${conversation.fip_number}: `}
      {conversation.fip_title || conversation.github_pr_title || conversation.topic}
    </Text>
    <Flex sx={{ direction: "row" }}>
      <Text sx={{ color: "#84817D" }}>{conversation.hname}</Text>
    </Flex>
  </Box>
)

type DashboardProps = {
  user: User
  selectedConversationId: string | null
}

const Dashboard = ({ user, selectedConversationId }: DashboardProps) => {
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
  const { zid_metadata } = useSelector((state: RootState) => state.zid_metadata)

  const [syncInProgress, setSyncInProgress] = useState(false)

  const [showNonFIPConversations, setShowNonFIPConversations] = useState(false)
  const [showOpenFIPConversations, setShowOpenFIPConversations] = useState(true)
  const [showArchivedConversations, setShowArchivedConversations] = useState(false)

  const [createConversationModalIsOpen, setCreateConversationModalIsOpen] = useState(false)

  const navigateToConversation = useCallback((conversationId) => {
    console.log(conversationId)
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
        <Box sx={{ overflowY: "scroll", flex: 1 }}>
          {selectedConversation ? (
            <Box>
              <Box sx={{ width: "100%" }}>
                {zid_metadata.is_owner && (
                  <Button
                    variant="outlineSecondary"
                    sx={{
                      position: "absolute",
                      top: [4],
                      right: [4],
                      alignItems: "center",
                      display: "flex",
                      gap: [1],
                    }}
                    onClick={() => hist.push(`/m/${zid_metadata.conversation_id}`)}
                  >
                    <Box>
                      <TbSettings />
                    </Box>
                    <Text>Edit</Text>
                  </Button>
                )}
                <Flex
                  sx={{
                    flexDirection: "column",
                    gap: [2],
                    margin: "0 auto",
                    pt: [7],
                    pb: [6],
                    px: [4],
                    maxWidth: "620px",
                  }}
                >
                  <Heading as="h2">
                    {selectedConversation.fip_title ||
                      selectedConversation.github_pr_title ||
                      selectedConversation.topic}
                  </Heading>
                  <Frontmatter conversation={selectedConversation} />
                  <Box>
                    <ReactMarkdown skipHtml={true} remarkPlugins={[remarkGfm]} linkTarget="_blank">
                      {selectedConversation.description}
                    </ReactMarkdown>
                  </Box>
                </Flex>
              </Box>
              {/* only display survey if logged in */}
              {user && (
                <Fragment>
                  {/* divider line */}
                  <Box sx={{ width: "100%", borderBottom: "1px solid #ddd" }}></Box>
                  <Box sx={{ width: "100%", position: "relative" }}>
                    <Box
                      sx={{
                        position: "absolute",
                        top: [4],
                        right: [4],
                        px: [2],
                        pt: "4px",
                        pb: "3px",
                        display: "flex",
                        flex: "1",
                        flexDirection: "row",
                        gap: [2],
                      }}
                    >
                      {zid_metadata.is_owner && (
                        <Button
                          variant="outlineSecondary"
                          onClick={() => hist.push(`/m/${zid_metadata.conversation_id}/comments`)}
                        >
                          Moderate
                        </Button>
                      )}
                      {zid_metadata.is_owner && (
                        <Button
                          variant="outlineSecondary"
                          onClick={() => hist.push(`/m/${zid_metadata.conversation_id}/report`)}
                        >
                          Results
                        </Button>
                      )}
                    </Box>
                    <Box
                      sx={{
                        margin: "0 auto",
                        maxWidth: "620px",
                        px: [4],
                        py: [2],
                        lineHeight: 1.45,
                      }}
                    >
                      <h2>Tell us what you think</h2>
                      <Text as="p" sx={{ mb: [3], pb: [1] }}>
                        Vote on remarks on this FIP by other community members, or add your own:
                      </Text>
                      <Survey
                        match={{
                          params: { conversation_id: selectedConversation.conversation_id },
                        }}
                      />
                    </Box>
                  </Box>
                </Fragment>
              )}
            </Box>
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
