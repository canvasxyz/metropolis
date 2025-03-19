import useSWR from "swr"
import React from "react"
import { Link as RouterLink, useLocation } from "react-router-dom"

import { MIN_SEED_RESPONSES } from "../../util/misc"
import ConversationListItem from "./conversation_list_item"
import { ConversationSummary } from "../../reducers/conversations_summary"
import { Badge, Button, Flex, Text } from "@radix-ui/themes"

const ConversationsList = ({
  selectedView,
  setSelectedView,
}: {
  selectedView: "all" | "fips" | "polls"
  setSelectedView: (view: "all" | "fips" | "polls") => void
}) => {
  const location = useLocation()
  const currentPath = location.pathname

  const { data } = useSWR(
    `conversations_summary`,
    async () => {
      const response = await fetch(`/api/v3/conversations_summary`)
      return (await response.json()) as ConversationSummary[]
    },
    { keepPreviousData: true, focusThrottleInterval: 500 },
  )

  const conversations = data || []

  const allConversations = conversations.filter(
    (c) =>
      (c.fip_version && !c.is_archived) ||
      (!c.fip_version && c.comment_count >= MIN_SEED_RESPONSES && !c.is_archived),
  )
  const fips = conversations.filter((c) => c.fip_version && !c.is_archived)
  const polls = conversations.filter(
    (c) => c.fip_version === null && c.comment_count >= MIN_SEED_RESPONSES && !c.is_archived,
  )

  const filteredConversations =
    selectedView === "all" ? allConversations : selectedView === "fips" ? fips : polls

  const conversationsToDisplay = filteredConversations.slice(0, 5)

  // Define target paths
  const sentimentPath = "/dashboard/sentiment"
  const pollsPath = "/dashboard/polls"

  // Check if we're already on the target page
  const isOnTargetPage =
    (selectedView === "fips" && currentPath === sentimentPath) ||
    (selectedView === "polls" && currentPath === pollsPath)

  return (
    <React.Fragment>
      <Flex justify="center" pt="8px" pb="6px" mx="16px">
        <Button
          className="left-group-button"
          variant="outline"
          size="3"
          color={selectedView === "all" ? "blue" : "gray"}
          onClick={() => setSelectedView("all")}
          style={{ width: "20%", borderRadius: "8px 0 0 8px", position: "relative", left: "1px" }}
        >
          All
          {/* <Badge
            key="type"
            size="1"
            radius="full"
            style={{
              boxShadow: "inset 0 0 0 1px var(--accent-a5)",
            }}
          >
            {allConversations.length}
          </Badge> */}
        </Button>
        <Button
          className="center-group-button"
          variant="outline"
          size="3"
          color={selectedView === "fips" ? "blue" : "gray"}
          onClick={() => setSelectedView("fips")}
          style={{ width: "48%", borderRadius: "0 0 0 0", borderLeft: 0 }}
        >
          Sentiment
          <Badge
            key="type"
            size="1"
            radius="full"
            style={{
              boxShadow: "inset 0 0 0 1px var(--accent-a5)",
            }}
          >
            {fips.length}
          </Badge>
        </Button>
        <Button
          className="right-group-button"
          variant="outline"
          size="3"
          color={selectedView === "polls" ? "blue" : "gray"}
          onClick={() => setSelectedView("polls")}
          style={{ width: "32%", borderRadius: "0 8px 8px 0", position: "relative", left: "-1px" }}
        >
          Polls
          <Badge
            key="type"
            size="1"
            radius="full"
            style={{
              boxShadow: "inset 0 0 0 1px var(--accent-a5)",
            }}
          >
            {polls.length}
          </Badge>
        </Button>
      </Flex>
      <Flex direction="column" overflowY="scroll" flexGrow="1">
        {conversationsToDisplay.map((conversation) => (
          <ConversationListItem
            conversation={conversation}
            key={conversation.conversation_id}
            initialViewCount={conversation.view_count}
          />
        ))}
        {conversationsToDisplay.length === 0 && (
          <Text color="gray" my="3" align="center" width="100%">
            None open right now
          </Text>
        )}
      </Flex>

      {selectedView !== "all" && !isOnTargetPage && (
        <Flex p="8px" mx="16px" mb="8px">
          <Button size="3" variant="outline" color="blue" style={{ width: "100%" }} asChild>
            <RouterLink to={selectedView === "fips" ? sentimentPath : pollsPath}>
              View all {selectedView === "fips" ? "sentiment checks" : "polls"}
            </RouterLink>
          </Button>
        </Flex>
      )}
    </React.Fragment>
  )
}

export default ConversationsList
