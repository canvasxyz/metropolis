import React from "react"
import { Box, Flex, Text } from "theme-ui"
import { TbDotsVertical } from "react-icons/tb"
import { Menu } from "@headlessui/react"

type Entry<T> = {
  id: T
  label: string
  count: number
}

export const ListSelector = <T,>({
  selectedEntryId,
  setSelectedEntryId,
  visibleEntries,
  dropdownEntries,
}: {
  selectedEntryId: T
  setSelectedEntryId: (id: T) => void
  visibleEntries: Entry<T>[]
  dropdownEntries: Entry<T>[]
}) => {
  const tab = {
    mr: "6px",
    px: "8px",
    pt: "6px",
    textAlign: "center",
    color: "primary",
    borderRadius: "10px",
    border: "1px solid lightGray",
    fontSize: "0.92em",
    cursor: "pointer",
    "&:hover": {
      bg: "bgGrayLight",
    },
  }

  const tabSelected = {
    ...tab,
    border: "1px solid primary",
    bg: "primary",
    color: "#fff",
    "&:hover": {},
  }

  const tabCount = {
    background: "primaryActive",
    color: "#fff",
    fontSize: "0.84em",
    borderRadius: "99px",
    px: "6px",
    py: "3px",
    ml: "2px",
    top: "-1px",
    position: "relative",
  }

  return (
    <Flex sx={{ pt: "9px", pb: "8px", pl: "13px" }}>
      {visibleEntries.map((entry) => (
        <Box
          key={entry.id.toString()}
          sx={selectedEntryId === entry.id ? tabSelected : tab}
          onClick={() => setSelectedEntryId(entry.id)}
        >
          {entry.label} <Text sx={tabCount}>{entry.count}</Text>
        </Box>
      ))}
      <Box sx={{ flex: 1 }}></Box>
      <Box>
        <Menu>
          <Menu.Button as="div">
            <Box sx={{ px: "10px", py: "3px", my: "3px", mr: "5px", cursor: "pointer" }}>
              <TbDotsVertical />
            </Box>
          </Menu.Button>
          <Menu.Items as={Box}>
            <Box variant="boxes.menu" sx={{ width: "180px" }}>
              {dropdownEntries.map((entry) => (
                <Menu.Item key={entry.id.toString()}>
                  <Box
                    variant={
                      selectedEntryId === entry.id ? "boxes.menuitemactive" : "boxes.menuitem"
                    }
                    onClick={() => setSelectedEntryId(entry.id)}
                  >
                    <Flex>
                      <Box sx={{ flex: 1 }}> {entry.label}</Box>
                      <Box sx={{ pr: [1], opacity: 0.6, fontSize: "0.93em", top: "1px" }}>
                        {entry.count}
                      </Box>
                    </Flex>
                  </Box>
                </Menu.Item>
              ))}
            </Box>
          </Menu.Items>
        </Menu>
      </Box>
    </Flex>
  )
}
