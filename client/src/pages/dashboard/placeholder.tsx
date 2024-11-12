import React from "react"

import { TbGitPullRequest } from "react-icons/tb"
import { BiSolidBarChartAlt2 } from "react-icons/bi"
import { useHistory } from "react-router-dom"
import { Box, Flex, Text } from "theme-ui"

import { useAppSelector } from "../../hooks"
import { ConversationSummary } from "../../reducers/conversations_summary"
import { RootState } from "../../store"
import { formatTimeAgo, MIN_SEED_RESPONSES } from "../../util/misc"
import { getIconForConversation } from "./conversation_list_item"

const ConversationsPreview = ({ conversations }: { conversations: ConversationSummary[] }) => {
  const hist = useHistory()

  return (
    <Box sx={{ pt: [3], ml: "26px" }}>
      {conversations.length === 0 && (
        <Box sx={{ fontWeight: 500, mt: [3], mb: [3], opacity: 0.5 }}>None found</Box>
      )}
      {conversations.map((c) => {
        const date = new Date(c.fip_version?.fip_created || +c.created)
        const timeAgo = formatTimeAgo(+date)

        return (
          <Flex
            sx={{
              bg: "bgWhite",
              border: "1px solid #e2ddd599",
              borderRadius: "8px",
              px: [3],
              py: "12px",
              mb: [2],
              lineHeight: 1.3,
              cursor: "pointer",
              "&:hover": {
                border: "1px solid #e2ddd5",
              },
            }}
            key={c.created}
            onClick={() => hist.push(`/dashboard/c/${c.conversation_id}`)}
          >
            <Box sx={{ pr: "13px", pt: "1px" }}>
              {c.github_pr_title ? (
                getIconForConversation(c)
              ) : (
                <BiSolidBarChartAlt2 color="#0090ff" />
              )}
            </Box>
            <Box>
              <Box>
                {c.github_pr_title && <Text sx={{ fontWeight: 600 }}>FIP: </Text>}
                {c.fip_title || c.github_pr_title || c.topic}
              </Box>
              <Box sx={{ opacity: 0.6, fontSize: "0.94em", mt: "3px", fontWeight: 400 }}>
                Created {timeAgo}
              </Box>
            </Box>
          </Flex>
        )
      })}
    </Box>
  )
}

export const Placeholder = () => {
  const { data } = useAppSelector((state: RootState) => state.conversations_summary)
  const conversations = data || []

  return (
    <Box sx={{ maxWidth: [null, "540px"], px: [3], py: [3], pt: [8], margin: "0 auto" }}>
      <Box>
        Welcome to Metropolis, a nonbinding sentiment check tool for the Filecoin community. You
        can:
      </Box>
      {/* FIPs */}
      <Flex sx={{ pt: [3], mt: [3] }}>
        <Box sx={{ flex: "0 0 25px" }}>
          <TbGitPullRequest color="#3fba50" style={{ marginRight: "6px" }} />
        </Box>
        <Box>
          <Text sx={{ fontWeight: 700 }}>Signal your position</Text> on FIPs through sentiment
          checks. <br />
          The following FIPs are currently open for sentiment checks:
        </Box>
      </Flex>
      <ConversationsPreview
        conversations={conversations
          .filter((c) => !c.is_archived && !c.is_hidden && c.github_pr_title && c.fip_files_created)
          .slice(0, 5)}
      />
      {/* discussions */}
      <Flex sx={{ pt: [3], mt: [3] }}>
        <Box sx={{ flex: "0 0 25px" }}>
          <BiSolidBarChartAlt2 color="#0090ff" style={{ marginRight: "6px" }} />
        </Box>
        <Box>
          <Text sx={{ fontWeight: 700 }}>
            Initiate discussions, collect feedback, and respond to polls
          </Text>{" "}
          on open-ended thoughts or ideas.
        </Box>
      </Flex>
      <Box sx={{ pt: [2], pl: "25px" }}>
        The following discussion polls have been active recently:
      </Box>
      <ConversationsPreview
        conversations={conversations
          .filter(
            (c) =>
              !c.is_archived &&
              !c.is_hidden &&
              !c.github_pr_title &&
              c.comment_count >= MIN_SEED_RESPONSES,
          )
          .slice(0, 5)}
      />
    </Box>
  )
}
