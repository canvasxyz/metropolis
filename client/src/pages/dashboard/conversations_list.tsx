import React, { useState, useCallback, useEffect } from "react"
import toast from "react-hot-toast"
import { useLocalStorage } from "usehooks-ts"
import { Button, Box, Flex, Text, Link } from "theme-ui"
import {
  TbExclamationCircle,
  TbCards,
  TbThumbUp,
  TbThumbDown,
  TbUser,
  TbUsers,
  TbChecks,
  TbMessage,
  TbMessage2,
  TbChevronDown,
  TbDots,
  TbPencil,
  TbRefresh,
  TbGitPullRequest,
  TbHammer,
  TbFlame,
  TbArchiveOff,
  TbArchive,
} from "react-icons/tb"
import { Menu } from "@headlessui/react"

import { formatTimeAgo } from "../../util/misc"
import api from "../../util/api"
import Spinner from "../../components/spinner"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { RootState } from "../../store"
import {
  ConversationSummary,
  populateConversationsSummary,
} from "../../reducers/conversations_summary"
import { useHistory } from "react-router-dom"

import {
  handleModerateConversation,
  handleUnmoderateConversation,
  handleCloseConversation,
  handleReopenConversation,
} from "../../actions"

type ConversationListSelection = "all-fip" | "open-fip" | "non-fip" | "archived" | "hidden"

const ConversationsList = ({
  user,
  selectedConversationId,
  setCreateConversationModalIsOpen,
  syncPRs,
  syncInProgress,
}: {
  user
  selectedConversationId: string | null
  setCreateConversationModalIsOpen: (arg0: boolean) => void
  syncPRs: () => void
  syncInProgress: boolean
}) => {
  const dispatch = useAppDispatch()
  const hist = useHistory()
  const [lastSync, setLastSync] = useState<number>()

  useEffect(() => {
    api.get("/api/v3/github_syncs", {}).then((result) => {
      if (!result.success) return
      const lastSync = Date.parse(result.latest.ts)
      setLastSync(lastSync)
    })
  }, [])

  const { data } = useAppSelector((state: RootState) => state.conversations_summary)
  const conversations = data || []

  const [selectedConversations, setSelectedConversations] =
    useLocalStorage<ConversationListSelection>("selectedConversations", "all-fip")

  useEffect(() => {
    dispatch(populateConversationsSummary())
  }, [])

  const navigateToConversation = useCallback((conversationId) => {
    hist.push(`/dashboard/c/${conversationId}`)
  }, [])

  const nonFIPConversations = conversations.filter(
    (conversation) =>
      !conversation.fip_title && !conversation.is_archived && !conversation.is_hidden,
  )
  const openConversations = conversations.filter(
    (conversation) =>
      conversation.fip_title && !conversation.is_archived && !conversation.is_hidden,
  )
  const allConversations = conversations.filter(
    (conversation) => !conversation.is_archived && !conversation.is_hidden,
  )
  const archivedConversations = conversations.filter(
    (conversation) => conversation.is_archived && !conversation.is_hidden,
  )
  const hiddenConversations = conversations.filter((conversation) => conversation.is_hidden)

  let conversationsToDisplay: ConversationSummary[]
  if (selectedConversations === "all-fip") {
    allConversations.sort((c1, c2) => {
      return (
        (c2.github_pr_opened_at ? new Date(c2.github_pr_opened_at).getTime() : c2.created) -
        (c1.github_pr_opened_at ? new Date(c1.github_pr_opened_at).getTime() : c1.created)
      )
    })
    conversationsToDisplay = allConversations
  } else if (selectedConversations === "open-fip") {
    conversationsToDisplay = openConversations
  } else if (selectedConversations === "non-fip") {
    conversationsToDisplay = nonFIPConversations
  } else if (selectedConversations === "archived") {
    conversationsToDisplay = archivedConversations
  } else if (selectedConversations === "hidden") {
    conversationsToDisplay = hiddenConversations
  } else {
    conversationsToDisplay = []
  }

  useEffect(() => {
    if (
      selectedConversations.length &&
      selectedConversationId === null &&
      conversationsToDisplay.length > 0
    ) {
      hist.replace(`/dashboard/c/${conversationsToDisplay[0].conversation_id}`)
    }
  }, [selectedConversationId, selectedConversations.length, conversationsToDisplay.length])

  if (data === null) {
    return <React.Fragment></React.Fragment>
  }

  return (
    <React.Fragment>
      <Menu>
        <Menu.Button as="div">
          <Box
            sx={{
              position: "relative",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "500",
              py: [2],
              px: [3],
              userSelect: "none",
              borderBottom: "1px solid #e2ddd5",
              "&:hover": {
                background: "bgGrayLight",
              },
            }}
          >
            {selectedConversations === "all-fip"
              ? "All"
              : selectedConversations === "open-fip"
              ? "FIPs"
              : selectedConversations === "non-fip"
              ? "Discussions"
              : selectedConversations === "archived"
              ? "Closed"
              : selectedConversations === "hidden"
              ? "Spam"
              : ""}
            <Box
              sx={{ position: "absolute", top: "8px", right: "12px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <TbChevronDown />
            </Box>
          </Box>
        </Menu.Button>
        <Menu.Items as={Box}>
          <Box variant="boxes.menu" sx={{ width: "180px" }}>
            <Menu.Item>
              <Box variant="boxes.menuitem" onClick={() => setSelectedConversations("all-fip")}>
                All
              </Box>
            </Menu.Item>
            <Menu.Item>
              <Box variant="boxes.menuitem" onClick={() => setSelectedConversations("open-fip")}>
                <Flex>
                  <Box sx={{ flex: 1 }}>FIPs</Box>
                  <Box sx={{ pr: [1], opacity: 0.6, fontSize: "0.93em", top: "1px" }}>
                    {openConversations.length}
                  </Box>
                </Flex>
              </Box>
            </Menu.Item>
            <Menu.Item>
              <Box variant="boxes.menuitem" onClick={() => setSelectedConversations("non-fip")}>
                <Flex>
                  <Box sx={{ flex: 1 }}>Discussions</Box>
                  <Box sx={{ pr: [1], opacity: 0.6, fontSize: "0.93em", top: "1px" }}>
                    {nonFIPConversations.length}
                  </Box>
                </Flex>
              </Box>
            </Menu.Item>
            <Menu.Item>
              <Box variant="boxes.menuitem" onClick={() => setSelectedConversations("archived")}>
                Closed
              </Box>
            </Menu.Item>
            <Menu.Item>
              <Box variant="boxes.menuitem" onClick={() => setSelectedConversations("hidden")}>
                Spam
              </Box>
            </Menu.Item>
          </Box>
        </Menu.Items>
      </Menu>
      <Box sx={{ height: "calc(100vh - 120px)", overflow: "scroll", pb: "70px" }}>
        {conversationsToDisplay.map((conversation) => (
          <ConversationListItem
            hist={hist}
            user={user}
            conversation={conversation}
            selectedConversationId={selectedConversationId}
            navigateToConversation={navigateToConversation}
            key={conversation.conversation_id}
            dispatch={dispatch}
          />
        ))}
      </Box>
      {(selectedConversations === "all-fip" || selectedConversations === "open-fip") && (
        <Box
          sx={{
            position: "absolute",
            bottom: "56px",
            fontSize: "0.88em",
            textAlign: "center",
            width: "300px",
            color: "#83817d",
          }}
        >
          Last sync: {formatTimeAgo(lastSync, true)} &nbsp;
          <Link variant="links.a" onClick={() => syncPRs()}>
            {syncInProgress ? <Spinner size={20} /> : `Sync now`}
          </Link>
        </Box>
      )}
      {
        <Button
          variant={user ? "buttons.primary" : "buttons.black"}
          sx={{
            px: [2],
            py: [1],
            mr: [1],
            mb: [1],
            position: "absolute",
            bottom: [2],
            right: "11px",
            fontSize: "0.94em",
            width: "calc(100% - 32px)",
            fontWeight: 500,
          }}
          onClick={() => {
            if (user) {
              setCreateConversationModalIsOpen(true)
            } else {
              document.location = `/api/v3/github_oauth_init?dest=${window.location.href}`
            }
          }}
        >
          <TbMessage2 /> {user ? "Create a discussion" : "Sign in to create discussions"}
        </Button>
      }
    </React.Fragment>
  )
}

type ConversationListItemProps = {
  hist
  user
  conversation: ConversationSummary
  selectedConversationId: string | null
  navigateToConversation: (conversationId: string) => void
  dispatch
}

const ConversationListItem = ({
  hist,
  user,
  conversation,
  selectedConversationId,
  navigateToConversation,
  dispatch,
}: ConversationListItemProps) => {
  const date = new Date(conversation.fip_created || +conversation.created)
  const timeAgo = formatTimeAgo(+date)

  const shouldHideDiscussion =
    !conversation.fip_title && !conversation.github_pr_title && conversation.comment_count < 10

  if (shouldHideDiscussion && conversation.owner !== user?.uid) return

  return (
    <Box
      sx={{
        position: "relative",
        padding: "12px 16px",
        cursor: "pointer",
        userSelect: "none",
        fontSize: "15px",
        lineHeight: 1.2,
        bg: conversation.conversation_id === selectedConversationId ? "bgGray" : "inherit",
        "&:hover": {
          bg: conversation.conversation_id === selectedConversationId ? "bgGray" : "bgGrayLight",
        },
      }}
      onClick={(e) => {
        e.preventDefault()
        navigateToConversation(conversation.conversation_id)
      }}
      key={conversation.conversation_id}
    >
      {shouldHideDiscussion && (
        <Box sx={{ fontSize: "0.8em", color: "#eb4b4c", ml: "20px" }}>
          <TbExclamationCircle color="#eb4b4c" /> Needs Seed Responses
        </Box>
      )}
      <Flex>
        <Box sx={{ color: "#84817D", fontSize: "90%", pr: "6px" }}>
          {conversation.github_pr_id ? (
            <TbGitPullRequest color="#3fba50" />
          ) : (
            <TbMessage2 color="#0090ff" />
          )}
        </Box>
        <Box sx={{ fontWeight: 500, flex: 1 }}>
          {conversation.fip_title || conversation.github_pr_title || conversation.topic || (
            <Text sx={{ color: "#84817D" }}>Untitled</Text>
          )}
          <Flex sx={{ opacity: 0.6, fontSize: "0.8em", mt: "3px", fontWeight: 400 }}>
            <Text sx={{ flex: 1 }}>{timeAgo}</Text>
            {conversation.fip_title || conversation.github_pr_title ? (
              <Text>{/* {conversation.sentiment_count ?? 0} <TbUsers /> */}</Text>
            ) : (
              <Text>
                {conversation.comment_count} <TbCards />
              </Text>
            )}
          </Flex>
        </Box>
      </Flex>
      {user && (user.uid === conversation.owner || user.isRepoCollaborator || user.isAdmin) && (
        <Box
          sx={{ position: "absolute", top: "13px", right: "15px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Menu>
            <Menu.Button as="div">
              <TbDots />
            </Menu.Button>
            <Menu.Items as={Box}>
              <Box variant="boxes.menu" sx={{ width: "190px" }}>
                <Menu.Item>
                  <Box
                    variant="boxes.menuitem"
                    onClick={() => hist.push(`/m/${conversation.conversation_id}`)}
                  >
                    <TbPencil /> Edit
                  </Box>
                </Menu.Item>

                <Menu.Item>
                  <Box
                    variant="boxes.menuitem"
                    onClick={() => hist.push(`/m/${conversation.conversation_id}/comments`)}
                  >
                    <TbHammer /> Moderate comments
                  </Box>
                </Menu.Item>
                {user.githubRepoCollaborator && (
                  <Menu.Item>
                    <Box
                      variant="boxes.menuitem"
                      onClick={() => {
                        if (conversation.is_hidden) {
                          if (!confirm("Show this proposal to users again?")) return
                          dispatch(handleUnmoderateConversation(conversation.conversation_id))
                          toast.success("Removed from spam")
                        } else {
                          if (!confirm("Mark as spam? This will hide the proposal from users."))
                            return
                          dispatch(handleModerateConversation(conversation.conversation_id))
                          toast.success("Moved to spam")
                        }
                      }}
                    >
                      <TbFlame /> {conversation.is_hidden ? "Unmark spam" : "Mark as spam"}
                    </Box>
                  </Menu.Item>
                )}
                {user &&
                  (user.uid === conversation.owner || user.isRepoCollaborator || user.isAdmin) && (
                    <Menu.Item>
                      <Box
                        variant="boxes.menuitem"
                        onClick={() => {
                          if (conversation.is_archived) {
                            if (!confirm("Reopen this discussion?")) return
                            dispatch(handleReopenConversation(conversation.conversation_id))
                            location.reload()
                          } else {
                            if (!confirm("Close this discussion?")) return
                            dispatch(handleCloseConversation(conversation.conversation_id))
                            location.reload()
                          }
                        }}
                      >
                        {conversation.is_archived ? <TbArchiveOff /> : <TbArchive />}{" "}
                        {conversation.is_archived ? "Reopen" : "Mark as closed"}
                      </Box>
                    </Menu.Item>
                  )}
              </Box>
            </Menu.Items>
          </Menu>
        </Box>
      )}
    </Box>
  )
}

export default ConversationsList
