import React, { useCallback, useEffect } from "react"
import { useLocalStorage } from "usehooks-ts"
import { Box, Flex, Text } from "theme-ui"

import { useAppDispatch, useAppSelector } from "../../hooks"
import { RootState } from "../../store"
import {
  ConversationSummary,
  populateConversationsSummary,
} from "../../reducers/conversations_summary"
import { useHistory } from "react-router-dom"

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
  selectedConversationId,
}: {
  selectedConversationId: string | null
}) => {
  const dispatch = useAppDispatch()
  const hist = useHistory()

  const { data } = useAppSelector((state: RootState) => state.conversations_summary)
  const conversations = data || []

  const [selectedConversationList, setSelectedConversationList] =
    useLocalStorage<ConversationListSelection>("selectedConversationList", "all-fip")

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
  if (selectedConversationList === "all-fip") {
    allConversations.sort((c1, c2) => {
      return (
        (c2.github_pr_opened_at ? new Date(c2.github_pr_opened_at).getTime() : c2.created) -
        (c1.github_pr_opened_at ? new Date(c1.github_pr_opened_at).getTime() : c1.created)
      )
    })
    conversationsToDisplay = allConversations
  } else if (selectedConversationList === "open-fip") {
    conversationsToDisplay = openConversations
  } else if (selectedConversationList === "non-fip") {
    conversationsToDisplay = nonFIPConversations
  } else if (selectedConversationList === "archived") {
    const archivedConversations = conversations.filter(
      (conversation) => conversation.is_archived && !conversation.is_hidden,
    )
    conversationsToDisplay = archivedConversations
  } else if (selectedConversationList === "hidden") {
    const hiddenConversations = conversations.filter((conversation) => conversation.is_hidden)
    conversationsToDisplay = hiddenConversations
  } else {
    conversationsToDisplay = []
  }

  return (
    <React.Fragment>
      <Box
        sx={{
          fontSize: "15px",
          fontWeight: "500",
          py: [2],
          px: [3],
          userSelect: "none",
        }}
      >
        <Box
          variant={selectedConversationList === "all-fip" ? "buttons.primary" : "buttons.outline"}
          sx={{
            px: [2],
            py: [1],
            mr: [1],
            mb: [1],
            display: "inline-block",
            bg: selectedConversationList === "all-fip" ? "#667ccb !important" : undefined,
          }}
          onClick={() => {
            setSelectedConversationList("all-fip")
          }}
        >
          All
        </Box>
        <Box
          variant={selectedConversationList === "open-fip" ? "buttons.primary" : "buttons.outline"}
          sx={{
            px: [2],
            py: [1],
            mr: [1],
            mb: [1],
            display: "inline-block",
            bg: selectedConversationList === "open-fip" ? "#667ccb !important" : undefined,
          }}
          onClick={() => {
            setSelectedConversationList("open-fip")
          }}
        >
          FIP PRs <Badge>{openConversations.length}</Badge>
        </Box>
        <Box
          variant={selectedConversationList === "non-fip" ? "buttons.primary" : "buttons.outline"}
          sx={{
            px: [2],
            py: [1],
            mr: [1],
            mb: [1],
            display: "inline-block",
            bg: selectedConversationList === "non-fip" ? "#667ccb !important" : undefined,
          }}
          onClick={() => {
            setSelectedConversationList("non-fip")
          }}
        >
          Discussions <Badge>{nonFIPConversations.length}</Badge>
        </Box>
      </Box>
      <Box sx={{ height: "calc(100vh - 120px)", overflow: "scroll" }}>
        {conversationsToDisplay.map((conversation) => (
          <ConversationListItem
            conversation={conversation}
            selectedConversationId={selectedConversationId}
            navigateToConversation={navigateToConversation}
            key={conversation.conversation_id}
          />
        ))}
      </Box>
      <Box sx={{ left: [3], bottom: [2], position: "absolute" }}>
        <Box
          variant={selectedConversationList === "archived" ? "buttons.primary" : "buttons.outline"}
          sx={{
            px: [2],
            py: [1],
            mr: [1],
            mb: [1],
            display: "inline-block",
            bg: selectedConversationList === "archived" ? "#667ccb !important" : undefined,
          }}
          onClick={() => {
            setSelectedConversationList("archived")
          }}
        >
          Past
        </Box>
        <Box
          variant={selectedConversationList === "hidden" ? "buttons.primary" : "buttons.outline"}
          sx={{
            px: [2],
            py: [1],
            mr: [1],
            mb: [1],
            display: "inline-block",
            bg: selectedConversationList === "hidden" ? "#667ccb !important" : undefined,
          }}
          onClick={() => {
            setSelectedConversationList("hidden")
          }}
        >
          Hidden
        </Box>
      </Box>
    </React.Fragment>
  )
}

type ConversationListItemProps = {
  conversation: ConversationSummary
  selectedConversationId: string | null
  navigateToConversation: (conversationId: string) => void
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
      {conversation.fip_title || conversation.github_pr_title || conversation.topic || (
        <Text sx={{ color: "#84817D" }}>Untitled</Text>
      )}
    </Text>
    <Flex sx={{ direction: "row", mt: [1] }}>
      <Text sx={{ color: "#84817D", fontSize: "90%" }}>
        {conversation.fip_created && conversation.github_pr_id ? (
          <Text>
            PR #{conversation.github_pr_id} · Created{" "}
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
            {" · "}
            {conversation.participant_count} participant
            {conversation.participant_count !== 1 ? "s" : ""}
          </Text>
        )}
      </Text>
    </Flex>
  </Box>
)

export default ConversationsList
