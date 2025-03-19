import {
  Button as RadixButton,
  DropdownMenu,
  TextField,
  Select,
  Button,
  Box,
} from "@radix-ui/themes"
import React, { useState } from "react"
import { BiFilter } from "react-icons/bi"
import { TbAdjustmentsHorizontal, TbSearch } from "react-icons/tb"
import { useSearchParams } from "react-router-dom-v5-compat"
import useSWR from "swr"
import { Flex, Text } from "theme-ui"

import { ClickableChecklistItem } from "../../../components/ClickableChecklistItem"
import { ConversationSummary } from "../../../reducers/conversations_summary"
import { ConversationEntry, ConversationStatus } from "./conversation_entry"
import { useAppSelector } from "../../../hooks"
import { MIN_SEED_RESPONSES } from "../../../util/misc"
import { CreateConversationModal } from "../../CreateConversationModal"
import { useDiscussionPollDisplayOptions } from "./useDiscussionPollDisplayOptions"
import { IsVisibleObserver } from "../../../components/IsVisibleObserver"

const conversationStatusOptions = {
  open: { label: "Open", color: "blue" },
  needs_responses: { label: "Needs Seed Responses", color: "red" },
  closed: { label: "Closed", color: "gray" },
}

const getSelectedConversationStatusesLabel = (
  selectedConversationStatuses: Record<ConversationStatus, boolean>,
) => {
  const entries = Object.entries(selectedConversationStatuses)
  const selectedEntries = entries.filter(([, v]) => v)

  if (selectedEntries.length === 0) {
    return "None"
  } else if (selectedEntries.length === entries.length) {
    return "All"
  } else {
    return selectedEntries
      .map(([k]) => conversationStatusOptions[k].label)
      .toSorted()
      .join(", ")
  }
}

export const TopRightFloating = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box position="absolute" top="54px" right="16px">
      {children}
    </Box>
  )
}

export default ({ only }: { only: "polls" | "sentiment" }) => {
  const allStatuses = ["open", "needs_responses", "closed"]
  const [selectedConversationStatuses, setSelectedConversationStatuses] = useState<
    Record<string, boolean>
  >({
    open: true,
    closed: false,
  })
  const { user } = useAppSelector((state) => state.user)
  const [createConversationModalIsOpen, setCreateConversationModalIsOpen] = useState(false)

  const { sortBy, setSortBy, resetDisplayOptions, saveDisplayOptions } =
    useDiscussionPollDisplayOptions()

  const [searchParams, setSearchParams] = useSearchParams()

  const searchParam = searchParams.get("search") || ""

  // We want to display the polls as an "infinite scrolling list"
  // The `scrollCursor` is the number of entries we want to display at a time
  // When the user scrolls to the bottom of the list, this cursor is incremented to add more items
  const [scrollCursor, setScrollCursor] = useState(0)
  const scrollPageSize = 10

  const { data } = useSWR(
    `conversations_summary_discussion_polls_${only}`,
    async () => {
      const response = await fetch(`/api/v3/conversations_summary`)
      // process the fip_version part if it exists
      // and any other extra fields
      const conversations = (await response.json()).filter((c) => {
        if (only === "polls") return !c.fip_version_id
        if (only === "sentiment") return !!c.fip_version_id
        return true
      }) as ConversationSummary[]

      const conversationsWithExtraFields = conversations.map((conversation) => {
        const displayed_title = conversation.topic

        const conversation_status: ConversationStatus = conversation.is_archived
          ? "closed"
          : !conversation.fip_version && conversation.comment_count < MIN_SEED_RESPONSES
            ? "needs_responses"
            : "open"

        return { ...conversation, displayed_title, conversation_status }
      })
      return { conversations: conversationsWithExtraFields }
    },
    { keepPreviousData: true, focusThrottleInterval: 500 },
  )

  const conversations = data?.conversations || []

  let sortFunction
  if (sortBy === "asc") {
    sortFunction = (c1, c2) => (c1.fip_created > c2.fip_created ? 1 : -1)
  } else if (sortBy === "desc") {
    sortFunction = (c1, c2) => (c1.fip_created > c2.fip_created ? -1 : 1)
  } else {
    sortFunction = (c1, c2) => (c1.fip_number > c2.fip_number ? 1 : -1)
  }

  const displayedConversations = (conversations || [])
    .filter((conversation) => {
      // the conversation's displayed title must include the search string, if it is given
      if (
        searchParam &&
        !(conversation.displayed_title || "").toLowerCase().includes(searchParam.toLowerCase())
      ) {
        return false
      }

      if (!selectedConversationStatuses[conversation.conversation_status]) {
        return false
      }

      return true
    })
    .toSorted(sortFunction)
    .slice(0, scrollCursor + scrollPageSize)

  return (
    <Box>
      {user && only === "polls" && (
        <TopRightFloating>
          <Button
            variant="surface"
            radius="large"
            onClick={() => setCreateConversationModalIsOpen(true)}
            style={{ cursor: "pointer" }}
          >
            <Text sx={{ display: "inline-block" }}>Create a poll</Text>
          </Button>
        </TopRightFloating>
      )}
      <Flex
        sx={{
          px: [3],
          py: [3],
          pt: [7],
          flexDirection: "column",
          gap: [3],
        }}
        id="scrollableDiv"
      >
        <Text sx={{ fontWeight: 600, fontSize: [2] }}>
          {only === "polls" ? <>Discussion Polling</> : <>Sentiment Checks</>}
        </Text>
        <Flex sx={{ gap: [2], width: "100%" }}>
          <Box flexGrow="1" maxWidth="400px">
            <TextField.Root
              placeholder="Search..."
              value={(searchParams as any).get("search") || ""}
              onChange={(e) => {
                setScrollCursor(0)
                setSearchParams({ search: e.target.value })
              }}
            >
              <TextField.Slot>
                <TbSearch style={{ color: "#B4B6C2" }} />
              </TextField.Slot>
            </TextField.Root>
          </Box>
          <Box flexGrow="1"></Box>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <RadixButton variant="surface">
                <BiFilter size="1.1em" style={{ color: "var(--accent-a11)", top: "-1px" }} />
                {`Filter: ${getSelectedConversationStatusesLabel(selectedConversationStatuses)}`}
              </RadixButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <ClickableChecklistItem
                color={"blue"}
                checked={Object.values(selectedConversationStatuses).every(
                  (value) => value === true,
                )}
                setChecked={(value) => {
                  setScrollCursor(0)
                  setSelectedConversationStatuses(() =>
                    Object.fromEntries(allStatuses.map((key) => [key, value])),
                  )
                }}
              >
                All
              </ClickableChecklistItem>
              <DropdownMenu.Separator />
              {allStatuses.map((status) => (
                <ClickableChecklistItem
                  key={status}
                  color={conversationStatusOptions[status].color}
                  checked={selectedConversationStatuses[status]}
                  setChecked={(value) => {
                    setScrollCursor(0)
                    setSelectedConversationStatuses((prev) => ({ ...prev, [status]: value }))
                  }}
                >
                  {conversationStatusOptions[status].label}
                </ClickableChecklistItem>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <RadixButton variant="surface">
                <TbAdjustmentsHorizontal style={{ color: "var(--accent-a11)" }} />
                Display
              </RadixButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Label>
                Sort by&nbsp;
                <Select.Root
                  defaultValue={sortBy || "desc"}
                  value={sortBy}
                  onValueChange={(v) => {
                    setSortBy(v as "asc" | "desc")
                    setScrollCursor(0)
                  }}
                >
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Group>
                      <Select.Item value="desc">Newest to Oldest</Select.Item>
                      <Select.Item value="asc">Oldest to Newest</Select.Item>
                    </Select.Group>
                  </Select.Content>
                </Select.Root>
              </DropdownMenu.Label>
              <DropdownMenu.Label
                onClick={(e) => {
                  e.preventDefault()
                }}
              >
                <RadixButton color="gray" variant="ghost" onClick={resetDisplayOptions}>
                  Reset
                </RadixButton>
                <Box flexGrow="1"></Box>
                <RadixButton variant="ghost" onClick={saveDisplayOptions}>
                  Save as default
                </RadixButton>
              </DropdownMenu.Label>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>
        <Flex sx={{ flexDirection: "column", gap: [2] }}>
          {displayedConversations.map((conversation) => (
            <ConversationEntry
              key={conversation.conversation_id}
              conversation={conversation}
              showCreationDate={true}
              user={user}
              type={only}
            />
          ))}
          {displayedConversations.length === 0 && data?.conversations && (
            <Flex sx={{ alignItems: "center", gap: 2 }}>
              <Text color="gray">None matching filters</Text>{" "}
              <Button
                size="1"
                variant="outline"
                color="gray"
                sx={{ marginTop: "2px" }}
                onClick={() => {
                  setScrollCursor(0)
                  setSearchParams({})
                  setSelectedConversationStatuses(() =>
                    Object.fromEntries(allStatuses.map((key) => [key, true])),
                  )
                }}
              >
                Clear all filters
              </Button>
            </Flex>
          )}
        </Flex>
        <Box top="-20px">
          <IsVisibleObserver
            callback={() => setScrollCursor((oldValue) => oldValue + scrollPageSize)}
          />
        </Box>
      </Flex>
      <CreateConversationModal
        isOpen={createConversationModalIsOpen}
        setIsOpen={setCreateConversationModalIsOpen}
      />
    </Box>
  )
}
