import { Button as RadixButton, DropdownMenu, TextField, Select } from "@radix-ui/themes"
import React, { useState } from "react"
import { BiFilter } from "react-icons/bi"
import {
  TbAdjustmentsHorizontal,
  TbCalendar,
  TbLayoutGrid,
  TbRefresh,
  TbSearch,
  TbUser,
} from "react-icons/tb"
import { useSearchParams } from "react-router-dom-v5-compat"
import useSWR from "swr"
import { Box, Flex, Text } from "theme-ui"

import { ClickableChecklistItem } from "../../../components/ClickableChecklistItem"
import { extractParagraphByTitle, FipEntry } from "./fip_entry"
import { statusOptions } from "./status_options"
import { useFipDisplayOptions } from "./useFipDisplayOptions"
import { DatePicker, DateRange } from "./date_picker"
import { FipVersion } from "../../../util/types"

const splitAuthors = (authorList = "") => {
  const result = authorList
    ?.replace(
      "<a list of the author's or authors' name(s) and/or username(s), or name(s) and email(s), e.g. (use with the parentheses or triangular brackets):",
      "",
    )
    .replace(/"|,$/g, "")
    .split(/, | and /)
  if (result && result.length === 1) {
    return result[0].split(/ @/).map((i) => {
      return `${i.slice(1).indexOf("@") !== -1 ? "" : "@"}${i.replace(/^@/, "").trim()}`
    })
  }
  return result
}

function processFipVersions(data: FipVersion[]) {
  if (!data) {
    return {}
  }

  const conversations: (FipVersion & {
    simple_summary: string
    fip_authors: string[]
    displayed_title: string
  })[] = []

  const allFipTypesSet = new Set<string | null>()
  const allFipAuthorsSet = new Set<string>()

  for (const conversation of data) {
    // don't show fips that don't have a fip status
    if (conversation.fip_status == null) {
      continue
    }

    allFipTypesSet.add(conversation.fip_type)

    const authors = splitAuthors(conversation.fip_author) || []
    for (const author of authors) {
      allFipAuthorsSet.add(author)
    }

    conversations.push({
      ...conversation,
      simple_summary: extractParagraphByTitle(conversation.fip_content, "Simple Summary"),
      fip_authors: authors,
      displayed_title:
        conversation.fip_title || conversation.github_pr.title,
    })
  }

  const allFipTypes = Array.from(allFipTypesSet)
  allFipTypes.sort()
  const allFipAuthors = Array.from(allFipAuthorsSet)
  allFipAuthors.sort()

  return { conversations, allFipTypes, allFipAuthors }
}

export default () => {
  const [selectedFipStatuses, setSelectedFipStatuses] = useState<Record<string, boolean>>({
    draft: true,
    "last-call": true,
    accepted: true,
    final: true,
    active: true,
    deferred: true,
    rejected: true,
    superseded: true,
  })

  const {
    showAuthors,
    setShowAuthors,
    showCategory,
    setShowCategory,
    showCreationDate,
    setShowCreationDate,
    showType,
    setShowType,
    sortBy,
    setSortBy,
    resetDisplayOptions,
    saveDisplayOptions,
  } = useFipDisplayOptions()

  const [searchParams, setSearchParams] = useSearchParams()

  const searchParam = searchParams.get("search") || ""
  const filterStatuses = Object.keys(selectedFipStatuses).filter(
    (status) => selectedFipStatuses[status],
  )
  // if draft is selected, also request WIP
  if (filterStatuses.indexOf("draft") !== -1) {
    filterStatuses.push("WIP")
  }

  const { data } = useSWR(
    `fips`,
    async () => {
      const response = await fetch(`/api/v3/fips`)
      const data = await response.json()
      return processFipVersions(data)
    },
    { keepPreviousData: true, focusThrottleInterval: 500 },
  )
  const {conversations, allFipTypes, allFipAuthors} = data || {}

  const [deselectedFipTypes, setDeselectedFipTypes] = useState<Record<string,boolean>>({})
  const [deselectedFipAuthors, setDeselectedFipAuthors] = useState<Record<string,boolean>>({})

  const [rangeValue, setRangeValue] = useState<DateRange>({ start: null, end: null })

  let sortFunction;
  if (sortBy === "asc") {
    sortFunction = (c1, c2) => (c1.fip_created > c2.fip_created ? 1 : -1)
  } else if(sortBy === "desc"){
    sortFunction = (c1, c2) => (c1.fip_created > c2.fip_created ? -1 : 1)
  } else {
    sortFunction = (c1, c2) => (c1.fip_number > c2.fip_number ? 1 : -1)
  }

  const displayedFips = (conversations || []).filter((conversation) => {
    // the conversation's displayed title must include the search string, if it is given
    if (
      searchParam &&
      !conversation.displayed_title.toLowerCase().includes(searchParam.toLowerCase())
    ) {
      return false
    }

    // the conversation must have one of the selected fip authors
    let hasMatchingFipAuthor = false
    for (const fipAuthor of conversation.fip_authors) {
      if (deselectedFipAuthors[fipAuthor] !== true) {
        hasMatchingFipAuthor = true
        break
      }
    }
    if (!hasMatchingFipAuthor) {
      return false
    }

    // the conversation's fip type must be one of the selected fip types
    if (
      conversation.fip_status &&
      !selectedFipStatuses[conversation.fip_status.toLowerCase().replace(" ", "-")]
    ) {
      return false
    }

    if(conversation.fip_type && deselectedFipTypes[conversation.fip_type]) {
      return false
    }

    if (rangeValue.start && rangeValue.end) {
      const conversationDate = new Date(Date.parse(conversation.fip_created))
      if (conversationDate < rangeValue.start || conversationDate > rangeValue.end) {
        return false
      }
    }

    return true
  }).toSorted(sortFunction)

  return (
    <Flex
      sx={{
        px: [3],
        py: [3],
        pt: [4],
        flexDirection: "column",
        gap: [3],
      }}
    >
      <Text sx={{ fontWeight: 600, fontSize: [2] }}>FIP Tracker</Text>
      <Flex sx={{ gap: [2], width: "100%" }}>
        <Box sx={{ flexGrow: "1", maxWidth: "400px" }}>
          <TextField.Root
            placeholder="Search..."
            value={(searchParams as any).get("search") || ""}
            onChange={(e) => setSearchParams({ search: e.target.value })}
          >
            <TextField.Slot>
              <TbSearch style={{ color: "#B4B6C2" }} />
            </TextField.Slot>
          </TextField.Root>
        </Box>
        <Box sx={{ flexGrow: "1" }}></Box>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <RadixButton variant="surface">
              <BiFilter size="1.1em" style={{ color: "var(--accent-a11)", top: "-1px" }} />
              Filters
            </RadixButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>
                <TbUser /> Authors
              </DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent>
                {(allFipAuthors || [])
                  .map((fipAuthor) => (
                    <ClickableChecklistItem
                      key={fipAuthor}
                      color={"blue"}
                      checked={deselectedFipAuthors[fipAuthor] !== true}
                      setChecked={(value) => {
                        setDeselectedFipAuthors((prev) => ({ ...prev, [fipAuthor]: !value }))
                      }}
                    >
                      {fipAuthor}
                    </ClickableChecklistItem>
                  ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>
                <TbRefresh /> Status
              </DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent>
                {[
                  "draft",
                  "last-call",
                  "accepted",
                  "final",
                  "active",
                  "deferred",
                  "rejected",
                  "superseded",
                ].map((fipStatus) => (
                  <ClickableChecklistItem
                    key={fipStatus}
                    color={statusOptions[fipStatus].color}
                    checked={selectedFipStatuses[fipStatus]}
                    setChecked={(value) => {
                      setSelectedFipStatuses((prev) => ({ ...prev, [fipStatus]: value }))
                    }}
                  >
                    {statusOptions[fipStatus].label}
                  </ClickableChecklistItem>
                ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>
                <TbCalendar /> Date
              </DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent>
                <DatePicker
                  rangeValue={rangeValue}
                  onRangeValueChange={(range) => setRangeValue(range)}
                />
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>
                <TbLayoutGrid /> Type
              </DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent>
                {(allFipTypes || [])
                  .map((fipType) => (
                    <ClickableChecklistItem
                      key={fipType}
                      color={"blue"}
                      checked={deselectedFipTypes[fipType] !== true}
                      setChecked={(value) => {
                        setDeselectedFipTypes((prev) => ({ ...prev, [fipType]: !value }))
                      }}
                    >
                      {fipType}
                    </ClickableChecklistItem>
                  ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
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
                onValueChange={(v) => setSortBy(v as "asc" | "desc")}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Group>
                    <Select.Item value="desc">Newest to Oldest</Select.Item>
                    <Select.Item value="asc">Oldest to Newest</Select.Item>
                    <Select.Item value="fip_number_asc">FIP number ascending</Select.Item>
                  </Select.Group>
                </Select.Content>
              </Select.Root>
            </DropdownMenu.Label>
            <DropdownMenu.Separator />
            <DropdownMenu.Label>Show / Hide</DropdownMenu.Label>
            <ClickableChecklistItem checked={showType} setChecked={setShowType}>
              Type
            </ClickableChecklistItem>
            <ClickableChecklistItem checked={showCategory} setChecked={setShowCategory}>
              Category
            </ClickableChecklistItem>
            <ClickableChecklistItem checked={showCreationDate} setChecked={setShowCreationDate}>
              Creation Date
            </ClickableChecklistItem>
            <ClickableChecklistItem checked={showAuthors} setChecked={setShowAuthors}>
              Authors
            </ClickableChecklistItem>
            <DropdownMenu.Separator />
            <DropdownMenu.Label
              onClick={(e) => {
                e.preventDefault()
              }}
            >
              <RadixButton color="gray" variant="ghost" onClick={resetDisplayOptions}>
                Reset
              </RadixButton>
              <Box sx={{ flexGrow: "1" }}></Box>
              <RadixButton variant="ghost" onClick={saveDisplayOptions}>
                Save as default
              </RadixButton>
            </DropdownMenu.Label>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Flex>
      <Flex sx={{ flexDirection: "column", gap: [3] }}>
        {displayedFips.map((conversation) => (
          <FipEntry
            key={conversation.id}
            conversation={conversation}
            showAuthors={showAuthors}
            showCategory={showCategory}
            showCreationDate={showCreationDate}
            showType={showType}
          />
        ))}
      </Flex>
    </Flex>
  )
}
