import React, { useState } from "react"
import { BiFilter } from "react-icons/bi"
import {
  TbAdjustmentsHorizontal,
  TbArrowUpRight,
  TbCalendar,
  TbCaretDown,
  TbCaretRight,
  TbSearch,
} from "react-icons/tb"

import { Box, Button, Flex, Grid, Input, Text } from "theme-ui"
import { useAppSelector } from "../../hooks"
import { RootState } from "../../store"
import { ConversationSummary } from "../../reducers/conversations_summary"
import { Link } from "react-router-dom-v5-compat"
import { MIN_SEED_RESPONSES } from "../../util/misc"

const Lozenge = ({
  text,
  color,
  bg,
  borderColor,
}: {
  text: string
  color: string
  bg: string
  borderColor: string
}) => {
  return (
    <Box sx={{ bg, borderStyle: "solid", borderColor, borderRadius: "16px", p: [1], color }}>
      {text}
    </Box>
  )
}

const colorOptions = {
  "last call": {
    bg: "#FFF1D9",
    borderColor: "#FFE4B7",
    color: "#BD8520",
  },
  draft: {
    bg: "#D5EFFF",
    borderColor: "#B0D6FF",
    color: "#006BCA",
  },
  accepted: {
    bg: "#D9F7D1",
    borderColor: "#BCE7A7",
    color: "#007A3D",
  },
  final: {
    bg: "#F9D9D9",
    borderColor: "#F0B0B0",
    color: "#C30000",
  },
}

const FipEntry = ({ conversation }: { conversation: ConversationSummary }) => {
  const [isOpen, setIsOpen] = useState(false)

  const fipStatusKey = conversation.fip_status ? conversation.fip_status.toLowerCase() : "draft"
  const colors = colorOptions[fipStatusKey] || colorOptions.draft

  return (
    <Flex
      key={conversation.conversation_id}
      sx={{
        bg: "white",
        padding: [3],
        borderStyle: "solid",
        borderRadius: "8px",
        borderColor: colors.borderColor,
        width: "100%",
        flexDirection: "row",
        gap: [3],
        cursor: "pointer",
      }}
      onClick={() => setIsOpen(!isOpen)}
    >
      <Grid
        sx={{
          gridTemplateColumns: "20px 1fr",
          gridRow: "auto auto",
          gridColumnGap: "20px",
          gridRowGap: "20px",
          width: "100%",
        }}
      >
        <Flex sx={{ flexDirection: "row", gap: [4], alignItems: "center" }}>
          {isOpen ? <TbCaretDown /> : <TbCaretRight />}
        </Flex>
        <Flex sx={{ flexDirection: "row", gap: [4], alignItems: "center" }}>
          <Text>{conversation.fip_number}</Text>
          <Text>
            {conversation.fip_title || conversation.github_pr_title || conversation.topic || (
              <Text sx={{ color: "#84817D" }}>Untitled</Text>
            )}
          </Text>
          <Box sx={{ flexGrow: "1" }}></Box>
          <Lozenge
            bg={colors.bg}
            borderColor={colors.borderColor}
            color={colors.color}
            text={conversation.fip_status}
          />
          <Link
            to={conversation.github_pr_url}
            target="_blank"
            noreferrer="noreferrer"
            noopener="noopener"
            sx={{
              display: "block",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              overflow: "hidden",
              width: "calc(100% - 20px)",
            }}
          >
            GitHub <TbArrowUpRight />
          </Link>
        </Flex>
        <Box></Box>
        <Flex sx={{ flexDirection: "row", gap: [2], alignItems: "center" }}>
          <Lozenge bg="white" borderColor="#ECECEF" color="#4E525B" text="Technical" />
          <Lozenge bg="white" borderColor="#ECECEF" color="#4E525B" text="Core" /> |
          <TbCalendar style={{ top: "0px" }} />
          {new Date(conversation.created).toLocaleDateString()} | 1 author
          <Box sx={{ flexGrow: "1" }}></Box>
        </Flex>
      </Grid>
    </Flex>
  )
}

export const FipTracker = ({ user }: { user: any }) => {
  const { data } = useAppSelector((state: RootState) => state.conversations_summary)
  const conversations = data || []

  const fips = conversations.filter((conversation) => {
    if (!conversation.fip_created) return false

    const shouldHideDiscussion =
      !conversation.fip_title &&
      !conversation.github_pr_title &&
      conversation.comment_count < MIN_SEED_RESPONSES

    if (shouldHideDiscussion && conversation.owner !== user?.uid) return false
    return true
  })

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
          <BiFilter size="1.1em" style={{ color: "#B6B8C4", top: "-1px" }} />
          <Text sx={{ color: "#4E525B" }}>Filters</Text>
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
          <TbAdjustmentsHorizontal style={{ color: "#B6B8C4", top: "-1px" }} />
          <Text sx={{ color: "#4E525B" }}>Display</Text>
        </Button>
      </Flex>
      <Flex sx={{ flexDirection: "column", gap: [3] }}>
        {fips.map((conversation) => (
          <FipEntry conversation={conversation} />
        ))}
      </Flex>
    </Flex>
  )
}
