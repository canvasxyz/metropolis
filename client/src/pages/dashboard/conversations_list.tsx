import React, { useState, useCallback, useEffect } from "react"
import { useLocalStorage } from "usehooks-ts"
import { Button, Box, Flex, Text, Link } from "theme-ui"
import { useHistory, Link as RouterLink } from "react-router-dom"
import {
  TbExclamationCircle,
  TbDots,
  TbDotsVertical,
  TbPencil,
  TbGitMerge,
  TbGitPullRequestClosed,
  TbGitPullRequestDraft,
  TbGitPullRequest,
  TbHammer,
  TbArchiveOff,
  TbArchive,
} from "react-icons/tb"
import { BiSolidBarChartAlt2 } from "react-icons/bi"
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
import { MIN_SEED_RESPONSES } from "./index"

import {
  // handleModerateConversation,
  // handleUnmoderateConversation,
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
      !conversation.github_pr_title &&
      !conversation.is_archived &&
      !conversation.is_hidden &&
      conversation.comment_count >= MIN_SEED_RESPONSES,
  )
  const openConversations = conversations.filter(
    (conversation) =>
      conversation.github_pr_title && !conversation.is_archived && !conversation.is_hidden,
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

  if (data === null) {
    return <React.Fragment></React.Fragment>
  }

  const tab = {
    mr: "6px",
    px: "8px",
    pt: "6px",
    textAlign: "center",
    color: "primary",
    borderRadius: "10px",
    border: "1px solid lightGray",
    fontSize: "0.92em",
    cursor: "pointer",
    "&:hover": {
      bg: "bgGrayLight",
    },
  }

  const tabSelected = {
    ...tab,
    border: "1px solid primary",
    bg: "primary",
    color: "#fff",
    "&:hover": {},
  }

  const tabCount = {
    background: "primaryActive",
    color: "#fff",
    fontSize: "0.84em",
    borderRadius: "99px",
    px: "6px",
    py: "3px",
    ml: "2px",
    top: "-1px",
    position: "relative",
  }

  return (
    <React.Fragment>
      <Flex sx={{ pt: "9px", pb: "8px", pl: "13px" }}>
        <Box
          sx={selectedConversations === "all-fip" ? tabSelected : tab}
          onClick={() => setSelectedConversations("all-fip")}
        >
          All <Text sx={tabCount}>{openConversations.length + nonFIPConversations.length}</Text>
        </Box>
        <Box
          sx={selectedConversations === "open-fip" ? tabSelected : tab}
          onClick={() => setSelectedConversations("open-fip")}
        >
          FIPs <Text sx={tabCount}>{openConversations.length}</Text>
        </Box>
        <Box
          sx={selectedConversations === "non-fip" ? tabSelected : tab}
          onClick={() => setSelectedConversations("non-fip")}
        >
          Polls <Text sx={tabCount}>{nonFIPConversations.length}</Text>
        </Box>
        <Box sx={{ flex: 1 }}></Box>
        <Box>
          <Menu>
            <Menu.Button as="div">
              <Box sx={{ px: "10px", py: "3px", my: "3px", mr: "5px", cursor: "pointer" }}>
                <TbDotsVertical />
              </Box>
            </Menu.Button>
            <Menu.Items as={Box}>
              <Box variant="boxes.menu" sx={{ width: "180px" }}>
                {/*
                <Menu.Item>
                  <Box
                    variant={
                      selectedConversations === "all-fip"
                        ? "boxes.menuitemactive"
                        : "boxes.menuitem"
                    }
                    onClick={() => setSelectedConversations("all-fip")}
                  >
                    All
                  </Box>
                </Menu.Item>
                <Menu.Item>
                  <Box
                    variant={
                      selectedConversations === "open-fip"
                        ? "boxes.menuitemactive"
                        : "boxes.menuitem"
                    }
                    onClick={() => setSelectedConversations("open-fip")}
                  >
                    <Flex>
                      <Box sx={{ flex: 1 }}>FIPs</Box>
                      <Box sx={{ pr: [1], opacity: 0.6, fontSize: "0.93em", top: "1px" }}>
                        {openConversations.length}
                      </Box>
                    </Flex>
                  </Box>
                </Menu.Item>
                <Menu.Item>
                  <Box
                    variant={
                      selectedConversations === "non-fip"
                        ? "boxes.menuitemactive"
                        : "boxes.menuitem"
                    }
                    onClick={() => setSelectedConversations("non-fip")}
                  >
                    <Flex>
                      <Box sx={{ flex: 1 }}>Polls</Box>
                      <Box sx={{ pr: [1], opacity: 0.6, fontSize: "0.93em", top: "1px" }}>
                        {nonFIPConversations.length}
                      </Box>
                    </Flex>
                  </Box>
                </Menu.Item>
                 */}
                <Menu.Item>
                  <Box
                    variant={
                      selectedConversations === "archived"
                        ? "boxes.menuitemactive"
                        : "boxes.menuitem"
                    }
                    onClick={() => setSelectedConversations("archived")}
                  >
                    <Flex>
                      <Box sx={{ flex: 1 }}> Closed</Box>
                      <Box sx={{ pr: [1], opacity: 0.6, fontSize: "0.93em", top: "1px" }}>
                        {archivedConversations.length}
                      </Box>
                    </Flex>
                  </Box>
                </Menu.Item>
                {/*
                <Menu.Item>
                  <Box
                    variant={
                      selectedConversations === "hidden" ? "boxes.menuitemactive" : "boxes.menuitem"
                    }
                    onClick={() => setSelectedConversations("hidden")}
                  >
                    <Flex>
                      <Box sx={{ flex: 1 }}> Spam</Box>
                      <Box sx={{ pr: [1], opacity: 0.6, fontSize: "0.93em", top: "1px" }}>
                        {hiddenConversations.length}
                      </Box>
                    </Flex>
                  </Box>
                </Menu.Item>
                 */}
              </Box>
            </Menu.Items>
          </Menu>
        </Box>
      </Flex>
      <Box sx={{ height: "calc(100vh - 150px)", overflow: "scroll", pb: "100px" }}>
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
            bottom: "0px",
            pb: "86px",
            pt: "20px",
            fontSize: "0.88em",
            textAlign: "center",
            width: "100%",
            color: "#83817d",
            background:
              "linear-gradient(0deg, #faf9f6 0%, #faf9f6 66%, #faf9f699 88%, transparent)",
          }}
        >
          Last sync: {isNaN(lastSync) ? "n/a" : formatTimeAgo(lastSync, true)} &nbsp;
          <Link variant="links.a" onClick={() => syncPRs()}>
            {syncInProgress ? <Spinner size={26} /> : `Sync now`}
          </Link>
        </Box>
      )}
      <Button
        variant={user ? "buttons.primary" : "buttons.black"}
        sx={{
          px: [2],
          py: [1],
          mr: [1],
          mb: [1],
          position: "absolute",
          bottom: "40px",
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
        {user ? <BiSolidBarChartAlt2 /> : null} {user ? "Create a poll" : "Sign in with Github"}
      </Button>
      <Box
        sx={{
          textAlign: "center",
          position: "absolute",
          bottom: "12px",
          width: "100%",
          fontSize: "0.88em",
          fontWeight: "600",
          borderTop: "1px solid lighterGray",
        }}
      >
        <RouterLink to="/about">About this platform</RouterLink>
      </Box>
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

export const getIconForConversation = (conversation: ConversationSummary) => {
  if (conversation.github_pr_id) {
    // conversation is a github pr
    if (conversation.github_pr_merged_at) {
      // pr is merged
      return <TbGitMerge color="#9C73EF" />
    } else if (conversation.github_pr_closed_at) {
      // pr is closed
      return <TbGitPullRequestClosed color="#E55E51" />
    } else {
      // pr is open
      if (conversation.github_pr_is_draft) {
        // pr is a draft
        return <TbGitPullRequestDraft color="#868D96" />
      } else {
        return <TbGitPullRequest color="#64B75D" />
      }
    }
  } else {
    // conversation is not a pr
    return <BiSolidBarChartAlt2 color="#0090ff" />
  }
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
    !conversation.fip_title &&
    !conversation.github_pr_title &&
    conversation.comment_count < MIN_SEED_RESPONSES

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
        <Box sx={{ fontSize: "0.8em", color: "#eb4b4c", ml: "1px", mb: "2px" }}>
          <TbExclamationCircle color="#eb4b4c" />
          &nbsp; Needs Example Responses
        </Box>
      )}
      <Flex>
        <Box sx={{ color: "#84817D", fontSize: "90%", pr: "6px" }}>
          {getIconForConversation(conversation)}
        </Box>
        <Box sx={{ fontWeight: 500, flex: 1 }}>
          {conversation.fip_title || conversation.github_pr_title || conversation.topic || (
            <Text sx={{ color: "#84817D" }}>Untitled</Text>
          )}
          <Flex sx={{ opacity: 0.6, fontSize: "0.8em", mt: "3px", fontWeight: 400 }}>
            <Text sx={{ flex: 1 }}>{timeAgo}</Text>
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
                        {conversation.is_archived ? "Reopen" : "Close"}
                      </Box>
                    </Menu.Item>
                  )}
                {/* user.githubRepoCollaborator && (
                  <Box sx={{ mt: "3px", pt: "3px", borderTop: "1px solid #e2ddd5" }}>
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
                  </Box>
                ) */}
              </Box>
            </Menu.Items>
          </Menu>
        </Box>
      )}
    </Box>
  )
}

export default ConversationsList
