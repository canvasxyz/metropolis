import React, { useCallback, useEffect } from "react"
import { useLocalStorage } from "usehooks-ts"
import { Box, Flex, Text } from "theme-ui"

import { useAppDispatch, useAppSelector } from "../../hooks"
import { RootState } from "../../store"
import { ConversationSummary, populateConversationsSummary } from "../../reducers/conversations_summary"
import { useHistory } from "react-router-dom"

const ConversationsList = ({selectedConversationId}: {selectedConversationId: string | null}) => {
  const dispatch = useAppDispatch()
  const hist = useHistory()

  const {data} = useAppSelector((state: RootState) => state.conversations_summary)
  const conversations = data || []

  const [showAllFIPConversations, setShowAllFIPConversations] = useLocalStorage("showAll", true)
  const [showOpenFIPConversations, setShowOpenFIPConversations] = useLocalStorage("showOpen", false)
  const [showNonFIPConversations, setShowNonFIPConversations] = useLocalStorage("showNonFIP", false)
  const [showArchivedConversations, setShowArchivedConversations] = useLocalStorage(
    "showArchived",
    false,
  )
  const [showHiddenConversations, setShowHiddenConversations] = useLocalStorage("showHidden", false)

  useEffect(() => {
    dispatch(populateConversationsSummary())
  }, [])


  const navigateToConversation = useCallback((conversationId) => {
    hist.push(`/dashboard/c/${conversationId}`)
  }, [])

  if(data === null) {
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
  const archivedConversations = conversations.filter(
    (conversation) => conversation.is_archived && !conversation.is_hidden,
  )
  const hiddenConversations = conversations.filter((conversation) => conversation.is_hidden)

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
    : showHiddenConversations
    ? hiddenConversations
    : []

  return <React.Fragment>
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
        variant={showAllFIPConversations ? "buttons.primary" : "buttons.outline"}
        sx={{ px: [2], py: [1], mr: [1], mb: [1], display: "inline-block" }}
        onClick={() => {
          setShowAllFIPConversations(true)
          setShowNonFIPConversations(false)
          setShowOpenFIPConversations(false)
          setShowArchivedConversations(false)
          setShowHiddenConversations(false)
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
          setShowHiddenConversations(false)
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
          setShowHiddenConversations(false)
        }}
      >
        Polls ({nonFIPConversations.length})
      </Box>
    </Box>
    <Box sx={{ height: "calc(100vh - 120px)", overflow: "scroll" }}>
      {selectedConversations.map((conversation) => (
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
        variant={showArchivedConversations ? "buttons.primary" : "buttons.outline"}
        sx={{ px: [2], py: [1], mr: [1], mb: [1], display: "inline-block" }}
        onClick={() => {
          setShowArchivedConversations(true)
          setShowAllFIPConversations(false)
          setShowNonFIPConversations(false)
          setShowOpenFIPConversations(false)
          setShowHiddenConversations(false)
        }}
      >
        Past
      </Box>
      <Box
        variant={showHiddenConversations ? "buttons.primary" : "buttons.outline"}
        sx={{ px: [2], py: [1], mr: [1], mb: [1], display: "inline-block" }}
        onClick={() => {
          setShowArchivedConversations(false)
          setShowAllFIPConversations(false)
          setShowNonFIPConversations(false)
          setShowOpenFIPConversations(false)
          setShowHiddenConversations(true)
        }}
      >
        Hidden
      </Box>
    </Box>
  </React.Fragment>
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
            {conversation.fip_status && " · "}
            {conversation.fip_status}
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
