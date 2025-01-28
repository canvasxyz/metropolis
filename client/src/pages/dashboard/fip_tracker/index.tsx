import dayjs from "dayjs"
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
import { FipEntry } from "./fip_entry"
import { statusOptions } from "./status_options"
import { useFipDisplayOptions } from "./useFipDisplayOptions"
import { DatePicker, DateRange } from "./date_picker"
import { FipVersion } from "../../../util/types"
import { getAuthorKey, splitAuthors, UserInfo } from "./splitAuthors"

function processFipVersions(data: FipVersion[]) {
  if (!data) {
    return {}
  }

  const allFipTypesSet = new Set<string | null>()

  // map holding all fip authors
  const allFipAuthors: Map<string, UserInfo> = new Map()

  // don't show fips that don't have a fip status
  const fipVersionsWithStatuses = data.filter((fip_version) => fip_version.fip_status !== null)

  const fip_versions = fipVersionsWithStatuses.map((fip_version) => {
    // parse fip type
    let fip_type = ""
    const fip_categories = []

    if (fip_version.fip_type.indexOf("Core") !== -1) {
      fip_type = "Technical"
      fip_categories.push("Core")
    }
    if (fip_version.fip_type.indexOf("Networking") !== -1) {
      fip_type = "Technical"
      fip_categories.push("Networking")
    }
    if (fip_version.fip_type.indexOf("Interface") !== -1) {
      fip_type = "Technical"
      fip_categories.push("Interface")
    }
    if (fip_version.fip_type.indexOf("Informational") !== -1) {
      fip_type = "Technical"
      fip_categories.push("Informational")
    }

    if (fip_version.fip_type.indexOf("Technical") !== -1) {
      fip_type = "Technical"
    }

    if (fip_version.fip_type.indexOf("Organizational") !== -1) {
      fip_type = "Organizational"
    }

    if (fip_version.fip_type.indexOf("FRC") !== -1) {
      fip_type = "FRC"
    }

    if (fip_version.fip_type.indexOf("Standards") !== -1) {
      fip_type = "Standards"
    }

    if (fip_version.fip_type.indexOf("N/A") !== -1) {
      fip_type = "N/A"
    }

    allFipTypesSet.add(fip_type)

    const authors = splitAuthors(fip_version.fip_author) || []
    for (const author of authors) {
      allFipAuthors[getAuthorKey(author)] = author
    }

    return {
      ...fip_version,
      fip_authors: authors,
      fip_type,
      fip_category: fip_categories.join(", "),
      displayed_title: fip_version.fip_title || fip_version.github_pr.title,
    }
  })

  const allFipTypes = Array.from(allFipTypesSet)
  allFipTypes.sort((a, b) => a.localeCompare(b))

  return { fip_versions, allFipTypes, allFipAuthors }
}

const FipTracker = () => {
  const allFipStatuses = Object.keys(statusOptions)
  const [selectedFipStatuses, setSelectedFipStatuses] = useState<Record<string, boolean>>(
    Object.fromEntries(
      allFipStatuses.map((status) => [status, true])
    )
  )

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

  const { data } = useSWR(
    `fips`,
    async () => {
      const response = await fetch(`/api/v3/fips`)
      const data = await response.json()
      return processFipVersions(data)
    },
    { keepPreviousData: true, focusThrottleInterval: 500 },
  )
  const { fip_versions, allFipTypes, allFipAuthors } = data || {}

  const [deselectedFipTypes, setDeselectedFipTypes] = useState<Record<string, boolean>>({})
  const [deselectedFipAuthors, setDeselectedFipAuthors] = useState<Record<string, boolean>>({})
  const [unlabeledAuthorDeselected, setUnlabeledAuthorDeselected] = useState<boolean>(false)

  const [rangeValue, setRangeValue] = useState<DateRange>({ start: null, end: null })

  const [showArchived, setShowArchived] = useState(false)
  const [showHidden, setShowHidden] = useState(false)

  const getFipCreated = (c) => {
    // Clean up some bad dates
    if (!c.fip_created && c.fip_number === 4) {
      return dayjs("2020-10-15").valueOf()
    }
    const parsed = dayjs(
      c.fip_created?.replace(/<|>/g, "").replace("2022-0218", "2022-02-18"),
    ).valueOf()
    return isNaN(parsed) ? 0 : parsed
  }

  let sortFunction
  if (sortBy === "asc") {
    sortFunction = (c1, c2) => (getFipCreated(c1) > getFipCreated(c2) ? 1 : -1)
  } else if (sortBy === "desc") {
    sortFunction = (c1, c2) => (getFipCreated(c1) > getFipCreated(c2) ? -1 : 1)
  } else {
    sortFunction = (c1, c2) => (c1.fip_number > c2.fip_number ? 1 : -1)
  }

  const displayedFips = (fip_versions || [])
    .filter((fip_version) => {
      // the conversation's displayed title must include the search string, if it is given
      if (
        searchParam &&
        !(fip_version.displayed_title || "").toLowerCase().includes(searchParam.toLowerCase())
      ) {
        return false
      }

      // the conversation must have one of the selected fip authors
      if (fip_version.fip_authors.length === 0) {
        if (unlabeledAuthorDeselected) {
          return false
        }
      } else {
        let hasMatchingFipAuthor = false
        for (const fipAuthor of fip_version.fip_authors) {
          const key = getAuthorKey(fipAuthor)
          if (deselectedFipAuthors[key] !== true) {
            hasMatchingFipAuthor = true
            break
          }
        }
        if (!hasMatchingFipAuthor) {
          return false
        }
      }

      if (fip_version.github_pr?.merged_at || fip_version.github_pr?.closed_at) {
        // conversation is closed
        if (!selectedFipStatuses.closed) {
          return false
        }
      } else if (fip_version.fip_status) {
        let fipStatusKey = fip_version.fip_status.toLowerCase().replace(" ", "-")
        if (fipStatusKey === "wip") {
          fipStatusKey = "draft"
        }

        if (!selectedFipStatuses[fipStatusKey]) {
          return false
        }
      }

      // the conversation's fip type must be one of the selected fip types
      if (fip_version.fip_type && deselectedFipTypes[fip_version.fip_type]) {
        return false
      }

      if (rangeValue.start && rangeValue.end) {
        const fipVersionCreatedDate = new Date(Date.parse(fip_version.fip_created))
        if (fipVersionCreatedDate < rangeValue.start || fipVersionCreatedDate > rangeValue.end) {
          return false
        }
      }

      return true
    })
    .toSorted(sortFunction)

  return (
    <Flex
      sx={{
        px: [3],
        py: [3],
        pt: [7],
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
                <ClickableChecklistItem
                  color={"blue"}
                  checked={
                    Object.values(deselectedFipAuthors).every((value) => value !== true) &&
                    !unlabeledAuthorDeselected
                  }
                  setChecked={(value) => {
                    setDeselectedFipAuthors(() =>
                      Object.fromEntries(
                        Object.keys(allFipAuthors || {}).map((key) => [key, !value]),
                      ),
                    )
                    setUnlabeledAuthorDeselected(!value)
                  }}
                >
                  All
                </ClickableChecklistItem>
                <ClickableChecklistItem
                  color={"blue"}
                  checked={!unlabeledAuthorDeselected}
                  setChecked={(value) => {
                    setUnlabeledAuthorDeselected(!value)
                  }}
                  showOnly={true}
                  selectOnly={() => {
                    setDeselectedFipAuthors(() =>
                      Object.fromEntries(
                        Object.keys(allFipAuthors || {}).map((key) => [key, true]),
                      ),
                    )
                    setUnlabeledAuthorDeselected(false)
                  }}
                >
                  Unlabeled
                </ClickableChecklistItem>
                <DropdownMenu.Separator />
                {Object.keys(allFipAuthors || {})
                  .toSorted((a, b) => a.localeCompare(b))
                  .map((fipAuthor) => (
                    <ClickableChecklistItem
                      key={fipAuthor}
                      color={"blue"}
                      checked={deselectedFipAuthors[fipAuthor] !== true}
                      setChecked={(value) => {
                        setDeselectedFipAuthors((prev) => ({ ...prev, [fipAuthor]: !value }))
                      }}
                      showOnly={true}
                      selectOnly={() => {
                        setDeselectedFipAuthors(() =>
                          Object.fromEntries(
                            Object.keys(allFipAuthors || {}).map((key) => [key, key !== fipAuthor]),
                          ),
                        )
                      }}
                    >
                      {allFipAuthors[fipAuthor].username
                        ? `@${allFipAuthors[fipAuthor].username}`
                        : allFipAuthors[fipAuthor].email}
                    </ClickableChecklistItem>
                  ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>
                <TbRefresh /> Status
              </DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent>
              <ClickableChecklistItem
                  color={"blue"}
                  checked={Object.values(selectedFipStatuses).every((value) => value === true)}
                  setChecked={(value) => {
                    setSelectedFipStatuses(() =>
                      Object.fromEntries(allFipStatuses.map((key) => [key, value]),),
                    )
                  }}
                >
                  All
                </ClickableChecklistItem>
                <DropdownMenu.Separator />
                {allFipStatuses.map((fipStatus) => (
                  <ClickableChecklistItem
                    key={fipStatus}
                    color={statusOptions[fipStatus].color}
                    checked={selectedFipStatuses[fipStatus]}
                    setChecked={(value) => {
                      setSelectedFipStatuses((prev) => ({ ...prev, [fipStatus]: value }))
                    }}
                    showOnly={true}
                    selectOnly={() => {
                      setSelectedFipStatuses(() =>
                        Object.fromEntries(
                          allFipStatuses.map((key) => [key, key === fipStatus]),
                        ),
                      )
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
                <ClickableChecklistItem
                  color={"blue"}
                  checked={Object.values(deselectedFipTypes).every((value) => value !== true)}
                  setChecked={(value) => {
                    setDeselectedFipTypes(() =>
                      Object.fromEntries(allFipTypes.map((key) => [key, !value]),),
                    )
                  }}
                >
                  All
                </ClickableChecklistItem>
                <DropdownMenu.Separator />
                {(allFipTypes || []).map((fipType) => (
                  <ClickableChecklistItem
                    key={fipType}
                    color={"blue"}
                    checked={deselectedFipTypes[fipType] !== true}
                    setChecked={(value) => {
                      setDeselectedFipTypes((prev) => ({ ...prev, [fipType]: !value }))
                    }}
                    showOnly={true}
                      selectOnly={() => {
                        setDeselectedFipTypes(() =>
                          Object.fromEntries(
                            allFipTypes.map((key) => [key, key !== fipType]),
                          ),
                        )
                      }}
                  >
                    {fipType}
                  </ClickableChecklistItem>
                ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
            <ClickableChecklistItem
              color={"blue"}
              checked={showArchived}
              setChecked={(value) => {
                setShowArchived(value)
              }}
            >
              Show Archived
            </ClickableChecklistItem>
            <ClickableChecklistItem
              color={"blue"}
              checked={showHidden}
              setChecked={(value) => {
                setShowHidden(value)
              }}
            >
              Show Hidden
            </ClickableChecklistItem>
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
      <Flex sx={{ flexDirection: "column", gap: "12px" }}>
        {displayedFips.map((fip_version) => (
          <FipEntry
            key={fip_version.id}
            fip_version={fip_version}
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

export default FipTracker
