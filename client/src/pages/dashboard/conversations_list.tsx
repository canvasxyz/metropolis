import useSWR from "swr"
import React, { useState, useEffect } from "react"
import { useLocalStorage } from "usehooks-ts"
import { Button, Box, Link } from "theme-ui"
import { TbExternalLink, TbFocus } from "react-icons/tb"
import { BiSolidBarChartAlt2 } from "react-icons/bi"

import { MIN_SEED_RESPONSES } from "../../util/misc"
import ConversationListItem from "./conversation_list_item"
import { ConversationSummary } from "../../reducers/conversations_summary"
import { Badge, Box, Button, Flex } from "@radix-ui/themes"

const ConversationsList = ({
  selectedView,
  setSelectedView,
}: {
  selectedView: "all" | "fips" | "polls"
  setSelectedView: (view: "all" | "fips" | "polls") => void
}) => {
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
    (c) => c.fip_version || c.comment_count >= MIN_SEED_RESPONSES,
  )
  const fips = conversations.filter((c) => c.fip_version)
  const polls = conversations.filter(
    (c) => c.fip_version === null && c.comment_count >= MIN_SEED_RESPONSES,
  )

  const filteredConversations =
    selectedView === "all" ? allConversations : selectedView === "fips" ? fips : polls

  const conversationsToDisplay = filteredConversations.slice(0, 5)

  return (
    <React.Fragment>
      <Flex justify="center" pt="8px" pb="6px" mx="16px">
        <Button
          className="left-group-button"
          variant="outline"
          size="3"
          color={selectedView === "all" ? "blue" : "gray"}
          onClick={() => setSelectedView("all")}
          style={{ flex: "1", borderRadius: "8px 0 0 8px", position: "relative", left: "1px" }}
        >
          All
          <Badge
            key="type"
            size="1"
            radius="full"
            style={{
              boxShadow: "inset 0 0 0 1px var(--accent-a5)",
            }}
          >
            {allConversations.length}
          </Badge>
        </Button>
        <Button
          className="center-group-button"
          variant="outline"
          size="3"
          color={selectedView === "fips" ? "blue" : "gray"}
          onClick={() => setSelectedView("fips")}
          style={{ flex: "1", borderRadius: "0 0 0 0", borderLeft: 0 }}
        >
          FIPs
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
          style={{ flex: "1", borderRadius: "0 8px 8px 0", position: "relative", left: "-1px" }}
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
      </Flex>
    </React.Fragment>
  )
}

export default ConversationsList
