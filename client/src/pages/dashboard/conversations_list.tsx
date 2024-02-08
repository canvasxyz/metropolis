import React, { useCallback, useEffect } from "react"
import { useLocalStorage } from "usehooks-ts"
import { Button, Box, Flex, Text } from "theme-ui"
import { Link as RouterLink } from "react-router-dom"
import {
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

const Badge = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box
      sx={{
        ml: "2px",
        display: "inline-block",
        fontSize: "0.82em",
        padding: "1px 5px",
        bg: "primaryActive",
        borderRadius: 99,
        color: "#fbf5e9",
        minWidth: 21,
        textAlign: "center",
        position: "relative",
        top: "-1px",
      }}
    >
      {children}
    </Box>
  )
}

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

  if (data === null) {
    return <React.Fragment></React.Fragment>
  }

  const nonFIPConversations = conversations.filter(
    (conversation) =>
      !conversation.fip_title && !conversation.is_archived && !conversation.is_hidden,
  )
  const openConversations = conversations.filter(
    (conversation) =>
      conversation.fip_title && !conversation.is_archived && !conversation.is_hidden,
  )
  const allConversations = openConversations.concat(nonFIPConversations)

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
    const archivedConversations = conversations.filter(
      (conversation) => conversation.is_archived && !conversation.is_hidden,
    )
    conversationsToDisplay = archivedConversations
  } else if (selectedConversations === "hidden") {
    const hiddenConversations = conversations.filter((conversation) => conversation.is_hidden)
    conversationsToDisplay = hiddenConversations
  } else {
    conversationsToDisplay = []
  }

  return (
    <React.Fragment>
      <Box
        sx={{
          position: "relative",
          fontSize: "15px",
          fontWeight: "500",
          py: [2],
          px: [3],
          userSelect: "none",
          borderBottom: "1px solid #e2ddd5",
        }}
      >
        {selectedConversations === "all-fip"
          ? "All"
          : selectedConversations === "open-fip"
          ? "Open FIPs"
          : selectedConversations === "non-fip"
          ? "Discussions"
          : selectedConversations === "archived"
          ? "Closed"
          : selectedConversations === "hidden"
          ? "Spam"
          : ""}
        <Box
          sx={{ position: "absolute", top: "10px", right: "12px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Menu>
            <Menu.Button as="div">
              <Box sx={{ cursor: "pointer", position: "relative", top: "-2px" }}>
                <TbChevronDown />
              </Box>
            </Menu.Button>
            <Menu.Items as={Box}>
              <Box variant="boxes.menu">
                <Menu.Item>
                  <Box variant="boxes.menuitem" onClick={() => setSelectedConversations("all-fip")}>
                    All
                  </Box>
                </Menu.Item>
                <Menu.Item>
                  <Box
                    variant="boxes.menuitem"
                    onClick={() => setSelectedConversations("open-fip")}
                  >
                    Open FIPs ({openConversations.length})
                  </Box>
                </Menu.Item>
                <Menu.Item>
                  <Box variant="boxes.menuitem" onClick={() => setSelectedConversations("non-fip")}>
                    Discussions ({nonFIPConversations.length})
                  </Box>
                </Menu.Item>
                <Menu.Item>
                  <Box
                    variant="boxes.menuitem"
                    onClick={() => setSelectedConversations("archived")}
                  >
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
        </Box>
      </Box>
      <Box sx={{ height: "calc(100vh - 120px)", overflow: "scroll" }}>
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
      {selectedConversations === "open-fip" && (
        <Button
          variant={"buttons.outline"}
          sx={{
            px: [2],
            py: [1],
            mr: [1],
            mb: [1],
            position: "absolute",
            bottom: [2],
            right: "11px",
            fontSize: "0.94em",
            fontWeight: 500,
          }}
          onClick={() => syncPRs()}
        >
          {syncInProgress ? <Spinner size={25} /> : <TbRefresh />}{" "}
          {syncInProgress ? "Syncing..." : "Sync PRs"}
        </Button>
      )}
      {
        <Button
          variant={"buttons.outline"}
          sx={{
            px: [2],
            py: [1],
            mr: [1],
            mb: [1],
            position: "absolute",
            bottom: [2],
            right: "11px",
            fontSize: "0.94em",
            fontWeight: 500,
          }}
          onClick={() => setCreateConversationModalIsOpen(true)}
        >
          Add a discussion
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
}: ConversationListItemProps) => (
  <Box
    sx={{
      position: "relative",
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
      {conversation.fip_title || conversation.github_pr_title || conversation.topic || (
        <Text sx={{ color: "#84817D" }}>Untitled</Text>
      )}
    </Text>
    <Flex sx={{ direction: "row", mt: [1] }}>
      <Text sx={{ color: "#84817D", fontSize: "90%" }}>
        {conversation.fip_created && conversation.github_pr_id ? (
          <Text>
            <TbGitPullRequest color="#3fba50" /> #{conversation.github_pr_id} opened on{" "}
            {(() => {
              const date = new Date(conversation.fip_created)
              return date.toLocaleDateString("en-us", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
              // return `${date.getMonth() + 1}/${date.getUTCDate()}/${date.getFullYear()}`
            })()}
          </Text>
        ) : (
          <Text>
            Discussion created{" "}
            {(() => {
              const date = new Date(conversation.created)
              return date.toLocaleDateString("en-us", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
              // return `${date.getMonth() + 1}/${date.getUTCDate()}/${date.getFullYear()}`
            })()}
          </Text>
        )}
      </Text>
    </Flex>
    {user && (user.uid === conversation.owner || user.isRepoCollaborator || user.isAdmin) && (
      <Box
        sx={{ position: "absolute", top: "10px", right: "12px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Menu>
          <Menu.Button as="div">
            <TbDots />
          </Menu.Button>
          <Menu.Items as={Box}>
            <Box variant="boxes.menu">
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
                  <TbHammer /> Moderate
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
                      } else {
                        if (!confirm("Hide this proposal from users?")) return
                        dispatch(handleModerateConversation(conversation.conversation_id))
                      }
                    }}
                  >
                    <TbFlame /> {conversation.is_hidden ? "Unmark spam" : "Mark as spam"}
                  </Box>
                </Menu.Item>
              )}
              {user &&
                (user.uid === conversation.owner || user.isRepoCollaborator || user.isAdmin) &&
                !conversation.github_pr_title && (
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

export default ConversationsList
