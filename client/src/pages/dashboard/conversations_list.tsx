import React, { useState, useEffect } from "react"
import { useLocalStorage } from "usehooks-ts"
import { Button, Box, Flex, Text, Link } from "theme-ui"
import { useHistory, Link as RouterLink } from "react-router-dom"
import {
  TbExternalLink,
  TbExclamationCircle,
  TbDots,
  TbPencil,
  TbGitMerge,
  TbGitPullRequestClosed,
  TbGitPullRequestDraft,
  TbGitPullRequest,
  TbHammer,
  TbArchiveOff,
  TbArchive,
  TbFocus,
} from "react-icons/tb"
import { BiSolidBarChartAlt2 } from "react-icons/bi"
import { Menu } from "@headlessui/react"

import { formatTimeAgo, MIN_SEED_RESPONSES } from "../../util/misc"
import api from "../../util/api"
import Spinner from "../../components/spinner"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { RootState } from "../../store"
import { useViewCount } from "../../reducers/view_counts"
import {
  ConversationSummary,
  populateConversationsSummary,
} from "../../reducers/conversations_summary"

import {
  // handleModerateConversation,
  // handleUnmoderateConversation,
  handleCloseConversation,
  handleReopenConversation,
} from "../../actions"
import { ListSelector } from "./list_selector"
import { ListingSelector } from "./listing_selector"
import { NavLink } from "react-router-dom-v5-compat"

type ConversationListSelection =
  | "all-fip"
  | "open-fip"
  | "non-fip"
  | "empty-fip"
  | "archived"
  | "hidden"

const ViewCount = ({ initialViewCount, conversation }) => {
  const viewCount = useViewCount(conversation.conversation_id)
  return <Text>{Math.max(viewCount, initialViewCount)}</Text>
}

const ConversationsList = ({
  user,
  setCreateConversationModalIsOpen,
  syncPRs,
  syncInProgress,
}: {
  user
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

  const nonFIPConversations = conversations.filter(
    (conversation) =>
      !conversation.github_pr_title &&
      !conversation.is_archived &&
      !conversation.is_hidden &&
      (conversation.comment_count >= MIN_SEED_RESPONSES || conversation.owner === user?.uid),
  )
  const emptyFIPConversations = conversations.filter(
    (conversation) =>
      conversation.github_pr_title &&
      !conversation.is_archived &&
      !conversation.is_hidden &&
      !conversation.fip_files_created,
  )
  const openConversations = conversations.filter(
    (conversation) =>
      conversation.github_pr_title &&
      !conversation.is_archived &&
      !conversation.is_hidden &&
      conversation.fip_files_created,
  )
  const allConversations = conversations.filter(
    (conversation) =>
      !conversation.is_archived &&
      !conversation.is_hidden &&
      (conversation.github_pr_title
        ? conversation.fip_files_created
        : conversation.comment_count >= MIN_SEED_RESPONSES || conversation.owner === user?.uid),
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
  } else if (selectedConversations === "empty-fip") {
    conversationsToDisplay = emptyFIPConversations
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

  return (
    <React.Fragment>
      <ListingSelector
        to="/dashboard/sentiment_checks"
        iconType={BiSolidBarChartAlt2}
        label="Sentiment Checks"
      />
      <ListingSelector to="/dashboard/fip_tracker" iconType={TbFocus} label="FIP Tracker" />

      <ListSelector<ConversationListSelection>
        selectedEntryId={selectedConversations}
        setSelectedEntryId={setSelectedConversations}
        visibleEntries={[
          {
            id: "all-fip",
            label: "All",
            count: allConversations.length,
          },
          {
            id: "open-fip",
            label: "FIPs",
            count: openConversations.length,
          },
          {
            id: "non-fip",
            label: "Polls",
            count: nonFIPConversations.length,
          },
        ]}
        dropdownEntries={[
          {
            id: "empty-fip",
            label: "FIPs (edits)",
            count: emptyFIPConversations.length,
          },
          {
            id: "archived",
            label: "Closed",
            count: archivedConversations.length,
          },
        ]}
      />
      <Box sx={{ height: "calc(100vh - 150px)", overflow: "scroll", pb: "100px" }}>
        {selectedConversations === "empty-fip" && (
          <Box
            sx={{
              px: 2,
              py: 2,
              fontSize: "80%",
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            These PRs only edit existing FIPs so <br />
            they cannot be voted on right now.
          </Box>
        )}
        {conversationsToDisplay.map((conversation) => (
          <ConversationListItem
            hist={hist}
            user={user}
            conversation={conversation}
            key={conversation.conversation_id}
            initialViewCount={conversation.view_count}
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
          Last sync: {isNaN(lastSync) ? "n/a" : formatTimeAgo(lastSync)} &nbsp;
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
        <RouterLink to="/about">
          <Text variant="links.a">About</Text>
        </RouterLink>{" "}
        &middot;{" "}
        <Link
          variant="links.a"
          as="a"
          target="_blank"
          rel="noreferrer"
          href="https://github.com/filecoin-project/FIPs"
        >
          FIPs <TbExternalLink style={{ position: "relative", top: 1, left: -1 }} />
        </Link>{" "}
        &middot;{" "}
        <Link
          variant="links.a"
          as="a"
          target="_blank"
          rel="noreferrer"
          href="https://github.com/canvasxyz/metropolis/issues/new/choose"
        >
          Bugs & Feedback <TbExternalLink style={{ position: "relative", top: 1, left: -1 }} />
        </Link>
      </Box>
    </React.Fragment>
  )
}

type ConversationListItemProps = {
  hist
  user
  conversation: ConversationSummary
  initialViewCount: number
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
  initialViewCount,
  dispatch,
}: ConversationListItemProps) => {
  const date = new Date(conversation.fip_created || +conversation.created)
  const timeAgo = formatTimeAgo(+date, true)

  const shouldHideDiscussion =
    !conversation.fip_title &&
    !conversation.github_pr_title &&
    conversation.comment_count < MIN_SEED_RESPONSES

  const emptyFIP = conversation.github_pr_title && !conversation.fip_files_created

  if (shouldHideDiscussion && conversation.owner !== user?.uid) return

  return (
    <NavLink to={`/dashboard/c/${conversation.conversation_id}`}>
      {({ isActive }) => (
        <Box
          sx={{
            position: "relative",
            opacity: emptyFIP ? 0.7 : null,
            pointerEvents: emptyFIP ? "none" : null,
            padding: "12px 16px",
            cursor: "pointer",
            userSelect: "none",
            fontSize: "15px",
            lineHeight: 1.2,
            color: "black",
            bg: isActive ? "bgGray" : "inherit",
            "&:hover": {
              bg: isActive ? "bgGray" : "bgGrayLight",
            },
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
                <Text sx={{ flex: 1 }}>
                  Created {timeAgo} ago &middot;{" "}
                  <ViewCount initialViewCount={initialViewCount} conversation={conversation} />{" "}
                  views
                </Text>
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
                        {conversation.is_archived ? <TbArchiveOff /> : <TbArchive />}{" "}
                        {conversation.is_archived ? "Reopen" : "Close"}
                      </Box>
                    </Menu.Item>
                    {user &&
                      (user.uid === conversation.owner ||
                        user.isRepoCollaborator ||
                        user.isAdmin) && (
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
                    {/* user.isRepoCollaborator && (
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
      )}
    </NavLink>
  )
}

export default ConversationsList
