import React, { useEffect } from "react"
import { useLocalStorage } from "usehooks-ts"
import { Box } from "theme-ui"

import { MIN_SEED_RESPONSES } from "../../util/misc"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { RootState } from "../../store"
import {
  ConversationSummary,
  populateConversationsSummary,
} from "../../reducers/conversations_summary"
import { ListSelector } from "./list_selector"
import ConversationListItem from "./conversation_list_item"

type ConversationListSelection =
  | "all-fip"
  | "open-fip"
  | "non-fip"
  | "empty-fip"
  | "archived"
  | "hidden"

const ConversationsList = () => {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.user)
  const { data } = useAppSelector((state: RootState) => state.conversations_summary)
  const conversations = data || []

  const [selectedConversations, setSelectedConversations] =
    useLocalStorage<ConversationListSelection>("selectedConversations", "all-fip")

  useEffect(() => {
    dispatch(populateConversationsSummary())
  }, [])

  const nonFIPConversations = conversations.filter(
    (conversation) =>
      !conversation.fip_version &&
      !conversation.is_archived &&
      !conversation.is_hidden &&
      (conversation.comment_count >= MIN_SEED_RESPONSES || conversation.owner === user?.uid),
  )
  const emptyFIPConversations = conversations.filter(
    (conversation) =>
      !conversation.is_archived &&
      !conversation.is_hidden &&
      conversation.fip_version &&
      !conversation.fip_version.fip_files_created,
  )
  const openConversations = conversations.filter(
    (conversation) =>
      !conversation.is_archived &&
      !conversation.is_hidden &&
      conversation.fip_version &&
      conversation.fip_version.fip_files_created,
  )
  const allConversations = conversations.filter(
    (conversation) =>
      !conversation.is_archived &&
      !conversation.is_hidden &&
      (conversation.fip_version
        ? conversation.fip_version.fip_files_created
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
        (c2.fip_version?.github_pr?.opened_at
          ? new Date(c2.fip_version.github_pr.opened_at).getTime()
          : c2.created) -
        (c1.fip_version?.github_pr?.opened_at
          ? new Date(c1.fip_version.github_pr.opened_at).getTime()
          : c1.created)
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
            conversation={conversation}
            key={conversation.conversation_id}
            initialViewCount={conversation.view_count}
          />
        ))}
      </Box>
    </React.Fragment>
  )
}

export default ConversationsList
