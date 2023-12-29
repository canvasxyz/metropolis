import { Link as RouterLink } from "react-router-dom"
import React, { useEffect } from "react"
import { Box, Text, Flex } from "theme-ui"
import { TbExternalLink } from "react-icons/tb"

import {
  handleCloseConversation,
  handleReopenConversation,
  populateConversationStatsStore,
} from "../actions"
import { DropdownMenu } from "../components/dropdown"

function ConversationRow({ c, i, stats, dispatch }: { c; i; stats; dispatch }) {
  useEffect(() => {
    if (!stats && !c.is_archived) {
      const until = null
      dispatch(populateConversationStatsStore(c.conversation_id, until))
    }
  }, [])

  return (
    <Box>
      <Flex
        sx={{
          overflowWrap: "break-word",
          py: [3],
          bb: [1],
          width: "100%",
          borderBottom: "1px solid #e6e7e8",
          borderTop: i === 0 ? "1px solid #e6e7e8" : "none",
        }}
      >
        <Box sx={{ lineHeight: 1.35, flex: 4 }}>
          <Box sx={{ my: [1] }}>
            {c.is_archived ? (
              <Text sx={{ color: "mediumGray" }}>{c.topic}</Text>
            ) : (
              <RouterLink to={`/c/${c.conversation_id}`}>
                <Text
                  sx={{
                    variant: "links.text",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  {c.topic}
                </Text>
              </RouterLink>
            )}
          </Box>
          <Box sx={{ my: [2] }}>
            <Text sx={{ fontSize: "84%", color: "mediumGray", mt: [1] }}>
              {!c.is_archived && (c.is_active ? "Voting Open" : "Voting Closed")}
            </Text>
          </Box>
          <Box sx={{ my: [2] }}>
            <Text
              sx={{
                fontSize: "84%",
                color: "mediumGray",
                mt: [1],
                textOverflow: "ellipsis",
                overflow: "hidden",
                WebkitLineClamp: "3",
                WebkitBoxOrient: "vertical",
                display: "-webkit-box",
              }}
            >
              {c.description}
            </Text>
          </Box>
        </Box>
        <Box
          sx={{
            ml: [4],
            color: c.is_archived ? "mediumGray" : "mediumGray",
            fontSize: "92%",
            mt: "3px",
            flex: [3, 1],
          }}
        >
          <Box>
            {c.participant_count} voter{c.participant_count === 1 ? "" : "s"}
          </Box>
          {!c.is_archived && (
            <Box>
              {stats?.commentTimes?.length} comment{stats?.commentTimes?.length === 1 ? "" : "s"}
            </Box>
          )}
          {!c.is_archived && (
            <Box>
              {stats?.voteTimes?.length} vote{stats?.voteTimes?.length === 1 ? "" : "s"}
            </Box>
          )}
        </Box>
        {!c.is_archived ? (
          <Box sx={{ flex: 1, textAlign: "right", ml: [3], maxWidth: 60 }}>
            <DropdownMenu
              rightAlign
              variant="outlineGray"
              buttonSx={{ textAlign: "left" }}
              options={[
                {
                  name: "Configure",
                  onClick: () => {
                    document.location = `/m/${c.conversation_id}`
                  },
                },
                {
                  name: "Moderate",
                  onClick: () => {
                    document.location = `/m/${c.conversation_id}/comments`
                  },
                },
                {
                  name: "See results",
                  onClick: () => {
                    document.location = `/m/${c.conversation_id}/report`
                  },
                },
                {
                  name: (
                    <React.Fragment>
                      Open survey <TbExternalLink />
                    </React.Fragment>
                  ),
                  onClick: () => {
                    window.open(`/c/${c.conversation_id}`)
                  },
                },
                {
                  name: "Move to archive",
                  onClick: () => {
                    if (!confirm("Archive this conversation?")) return
                    dispatch(handleCloseConversation(c.conversation_id))
                  },
                  sx: { variant: "buttons.outlineRed" },
                },
              ]}
            />
          </Box>
        ) : (
          <Box sx={{ flex: 1, textAlign: "right", ml: [3], maxWidth: 60 }}>
            <DropdownMenu
              rightAlign
              options={[
                {
                  name: "Unarchive",
                  onClick: () => {
                    if (confirm("Reopen this archived conversation?")) {
                      dispatch(handleReopenConversation(c.conversation_id))
                    }
                  },
                },
              ]}
            />
          </Box>
        )}
      </Flex>
    </Box>
  )
}

export default ConversationRow
