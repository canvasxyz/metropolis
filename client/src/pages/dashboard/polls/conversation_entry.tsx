import React from "react"
import { TbCalendar, TbUser, TbEye } from "react-icons/tb"
import { Box, Flex, Grid } from "theme-ui"

import { Badge, Text } from "@radix-ui/themes"
import { ConversationSummary } from "../../../reducers/conversations_summary"
import { useNavigate } from "react-router-dom-v5-compat"

export const ConversationEntry = ({
  conversation,
  showCreationDate,
}: {
  conversation: ConversationSummary & {
    displayed_title: string
  }
  showCreationDate: boolean
}) => {
  const navigate = useNavigate()

  const fipAttributes = []
  if (showCreationDate) {
    fipAttributes.push(
      <Flex sx={{ display: "inline-block", alignItems: "center", gap: [1], whiteSpace: "nowrap" }}>
        <TbCalendar />
        <Text> {new Date(conversation.created).toLocaleDateString()}</Text>
      </Flex>,
    )
  }

  const color = conversation.is_archived ? "gray" : "blue"
  const statusLabel = conversation.is_archived ? "Archived" : "Active"
  const voterCount = conversation.participant_count || conversation.sentiment_count || 0
  const commentCount = conversation.comment_count
  const viewCount = conversation.view_count

  fipAttributes.push(
    <Flex sx={{ display: "inline-block", alignItems: "center", gap: [1], whiteSpace: "nowrap" }}>
      <TbEye style={{ position: "relative", top: "2px", marginRight: "1px" }} /> {viewCount} view
      {viewCount !== 1 ? "s" : ""}
    </Flex>,
  )

  if (voterCount) {
    fipAttributes.push(
      <Flex sx={{ display: "inline-block", alignItems: "center", gap: [1], whiteSpace: "nowrap" }}>
        <Text>{voterCount} voted</Text>
      </Flex>,
    )
  }

  return (
    <div
      style={{
        cursor: "pointer",
        borderRadius: "8px",
        borderStyle: "solid",
        borderWidth: "1px",
        borderLeftWidth: "4px",
        // this uses the color palette defined by radix-ui
        borderColor: color === "gray" ? `#ccc` : `var(--${color}-10)`,
        padding: "3px 0 6px",
        background: "#fff",
      }}
      onClick={() => navigate(`/dashboard/c/${conversation.conversation_id}`)}
    >
      <Grid
        sx={{
          margin: "10px",
          gridTemplateColumns: "1fr",
          gridRow: "auto auto",
          gridColumnGap: "20px",
          gridRowGap: "4px",
          px: "10px",
        }}
      >
        {/* grid spacer for first column */}
        <Flex sx={{ flexDirection: "row", gap: [1], alignItems: "center" }}>
          <Text style={{ flex: 1, lineHeight: 1.3, fontSize: "95%", fontWeight: 500 }}>
            {conversation.displayed_title ??
              (conversation.fip_version ? (
                conversation.fip_version.fip_title
              ) : (
                <Text sx={{ color: "#84817D" }}>Untitled</Text>
              ))}
          </Text>
          <Badge size="2" color={color} variant="surface" radius="full">
            {statusLabel}
          </Badge>
        </Flex>
        <Box></Box>
        <Flex sx={{ flexDirection: "row", gap: [2], alignItems: "center", fontSize: "90%" }}>
          {fipAttributes.map((attr, i) => (
            <Text key={i} style={{ fontSize: "94%", opacity: 0.7, whiteSpace: "nowrap" }}>
              {i > 0 && (
                <Text
                  style={{
                    marginLeft: "2px",
                    marginRight: "9px",
                    top: "-1px",
                    position: "relative",
                    opacity: 0.5,
                  }}
                >
                  |
                </Text>
              )}
              {attr}
            </Text>
          ))}
          <Box sx={{ flexGrow: "1" }}></Box>
        </Flex>
      </Grid>
    </div>
  )
}
