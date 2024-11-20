import React from "react"
import { ConversationSummary } from "../../reducers/conversations_summary"
import { formatTimeAgo, MIN_SEED_RESPONSES } from "../../util/misc"
import { NavLink } from "react-router-dom-v5-compat"
import { Box, Flex, Text } from "theme-ui"
import { TbExclamationCircle, TbGitMerge, TbGitPullRequest, TbGitPullRequestClosed, TbGitPullRequestDraft } from "react-icons/tb"

import { useViewCount } from "../../reducers/view_counts"
import { BiSolidBarChartAlt2 } from "react-icons/bi"
import ConversationListItemMenu from "./conversation_list_item_menu"
import { useAppSelector } from "../../hooks"

const ViewCount = ({ initialViewCount, conversation }: {initialViewCount: number; conversation: ConversationSummary}) => {
  const viewCount = useViewCount(conversation.conversation_id)
  return <Text>{Math.max(viewCount, initialViewCount)}</Text>
}

export const getIconForConversation = (conversation: ConversationSummary) => {
  const githubPr = conversation.fip_version?.github_pr
  if (githubPr) {
    // conversation is a github pr
    if (githubPr.merged_at) {
      // pr is merged
      return <TbGitMerge color="#9C73EF" />
    } else if (githubPr.closed_at) {
      // pr is closed
      return <TbGitPullRequestClosed color="#E55E51" />
    } else {
      // pr is open
      if (githubPr.is_draft) {
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

type ConversationListItemProps = {
  conversation: ConversationSummary
  initialViewCount: number
}

const ConversationListItem = ({
  conversation,
  initialViewCount,
}: ConversationListItemProps) => {
  const { user } = useAppSelector((state) => state.user)
  const date = new Date(conversation.fip_version ? conversation.fip_version.fip_created : +conversation.created)
  const timeAgo = formatTimeAgo(+date, true)

  const shouldHideDiscussion = !conversation.fip_version && conversation.comment_count < MIN_SEED_RESPONSES

  // TODO: should we show the conversation if the FIP is empty?
  // const emptyFIP = conversation.fip_version !== null && conversation.fip_version.fip_files_created

  const displayTitle = conversation.fip_version ? conversation.fip_version.fip_title : conversation.topic

  if (shouldHideDiscussion && conversation.owner !== user?.uid) return

  return (
    <NavLink to={`/dashboard/c/${conversation.conversation_id}`} >
      {({ isActive }) => (
        <Box
          sx={{
            position: "relative",
            // opacity: emptyFIP ? 0.7 : null,
            // pointerEvents: emptyFIP ? "none" : null,
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
              {displayTitle || (
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
            <ConversationListItemMenu conversation={conversation} />
          )}
        </Box>
      )}
    </NavLink>
  )
}

export default ConversationListItem
