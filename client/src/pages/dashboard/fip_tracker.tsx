import React from "react"
import { BiFilter } from "react-icons/bi"
import { TbAdjustmentsHorizontal, TbSearch } from "react-icons/tb"

import { Box, Button, Flex, Input, Text } from "theme-ui"

export const FipTracker = () => {
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
        <Box
          sx={{
            bg: "white",
            borderColor: "#E6E6EB",
            borderStyle: "solid",
            borderRadius: "8px",
            borderWidth: "1px",
            display: "flex",
            position: "relative",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              height: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <TbSearch
              size="1.5em"
              style={{
                top: "0px",
                left: "5px",
                pointerEvents: "none",
                color: "#B4B6C2",
              }}
            />
          </Box>
          <Input
            sx={{
              margin: "0",
              paddingLeft: "32px",
              bg: "unset",
              color: "#595E66",
              borderStyle: "none",
              width: "400px",
            }}
            placeholder="Search"
          />
        </Box>
        <Box sx={{ flexGrow: "1" }}></Box>
        <Button
          sx={{
            bg: "white",
            color: "#51555E",
            borderColor: "#E6E6EB",
            minWidth: "unset",
            ":hover": { bg: "bgOffWhite" },
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: [1],
          }}
        >
          <BiFilter />
          <Text>Filters</Text>
        </Button>
        <Button
          sx={{
            bg: "white",
            color: "#51555E",
            borderColor: "#E6E6EB",
            minWidth: "unset",
            ":hover": { bg: "bgOffWhite" },
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: [1],
          }}
        >
          <TbAdjustmentsHorizontal />
          <Text>Display</Text>
        </Button>
      </Flex>
    </Flex>
  )
}
