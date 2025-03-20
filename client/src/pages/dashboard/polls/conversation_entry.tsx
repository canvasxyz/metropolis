import React from "react"
import { TbCalendar, TbEye } from "react-icons/tb"
import { Box, Flex, Grid } from "theme-ui"

import { Badge, Text, DropdownMenu } from "@radix-ui/themes"
import { ConversationSummary } from "../../../reducers/conversations_summary"
import { getIconForConversation, getColorForConversation } from "../conversation_list_item"
import { useNavigate } from "react-router-dom-v5-compat"
import { handleTagConversation } from "../../../actions"
import { useAppDispatch } from "../../../hooks"
import ConversationListItemMenu from "../conversation_list_item_menu"

export type ConversationStatus = "open" | "needs_responses" | "closed"

export const ConversationEntry = ({
  conversation,
  showCreationDate,
  user,
  type,
  allTags = [],
  refetchPolls,
}: {
  conversation: ConversationSummary & {
    conversation_status: ConversationStatus
    displayed_title: string
  }
  showCreationDate: boolean
  user
  type: "polls" | "sentiment"
  allTags?: string[]
  refetchPolls: () => void
}) => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [menuOpen, setMenuOpen] = React.useState(false)

  const fipAttributes = []
  if (showCreationDate) {
    fipAttributes.push(
      <Flex sx={{ display: "inline-block", alignItems: "center", gap: [1], whiteSpace: "nowrap" }}>
        <TbCalendar />
        <Text> {new Date(conversation.created).toLocaleDateString()}</Text>
      </Flex>,
    )
  }

  const statusLabel = conversation.is_archived ? "Archived" : "Active"
  const voterCount = conversation.participant_count || conversation.sentiment_count || 0
  const viewCount = conversation.view_count || 0

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

  if (conversation.tags) {
    fipAttributes.push(
      <Flex sx={{ display: "inline-block", alignItems: "center", gap: [1], whiteSpace: "nowrap" }}>
        <Text sx={{ fontWeight: "500" }}>{conversation.tags}</Text>
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
        borderColor: conversation.is_archived ? `#ccc` : getColorForConversation(conversation),
        padding: "3px 0 6px",
        background: "#fff",
      }}
      onClick={() => navigate(`/dashboard/c/${conversation.conversation_id}`)}
    >
      <Grid
        sx={{
          margin: "10px",
          gridTemplateColumns: "10px 1fr",
          gridRow: "auto auto",
          gridColumnGap: "20px",
          gridRowGap: "4px",
          px: "10px",
        }}
      >
        {/* grid spacer for first column */}
        <Box>
          <div style={conversation.is_archived ? { filter: "grayscale(100%)" } : {}}>
            {getIconForConversation(conversation)}
          </div>
        </Box>
        <Flex sx={{ position: "relative", flexDirection: "row", gap: [1], alignItems: "center" }}>
          <Text style={{ flex: 1, lineHeight: 1.3, fontSize: "95%", fontWeight: 500 }}>
            {conversation.displayed_title ??
              (conversation.fip_version ? (
                conversation.fip_version.fip_title
              ) : (
                <Text sx={{ color: "#84817D" }}>Untitled</Text>
              ))}
            {conversation.conversation_status === "needs_responses" && (
              <Text ml="3" color="red">
                (Needs seed responses)
              </Text>
            )}
          </Text>
          {/* <Badge
            size="2"
            color={conversation.is_archived ? "gray" : "blue"}
            variant="surface"
            radius="full"
          >
            {statusLabel}
          </Badge> */}

          {type === "sentiment" && user?.isRepoCollaborator && (
            <Box onClick={(e) => e.stopPropagation()}>
              <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenu.Trigger onClick={(e) => e.stopPropagation()}>
                  <Badge
                    size="1"
                    color="gray"
                    variant="soft"
                    radius="full"
                    style={{ cursor: "pointer", position: "relative", left: "3px" }}
                  >
                    Set Tag
                  </Badge>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  {allTags.length > 0 && (
                    <>
                      {allTags.map((tag) => (
                        <DropdownMenu.Item
                          key={tag}
                          onClick={() => {
                            setMenuOpen(false);
                            dispatch(handleTagConversation(conversation.conversation_id, tag))
                              .then(() => refetchPolls())
                              .catch(error => console.error("Error tagging conversation:", error));
                          }}
                        >
                          {tag}
                        </DropdownMenu.Item>
                      ))}
                      <DropdownMenu.Separator />
                    </>
                  )}
                  <DropdownMenu.Item
                    onClick={() => {
                      const tag = prompt("Enter a tag:")
                      setMenuOpen(false);
                      if (tag) {
                        dispatch(handleTagConversation(conversation.conversation_id, tag))
                          .then(() => refetchPolls())
                          .catch(error => console.error("Error tagging conversation:", error));
                      }
                    }}
                  >
                    New tag...
                  </DropdownMenu.Item>
                  {conversation.tags && (
                    <>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item
                        onClick={() => {
                          setMenuOpen(false);
                          dispatch(handleTagConversation(conversation.conversation_id, ""))
                            .then(() => refetchPolls())
                            .catch(error => console.error("Error clearing tag:", error));
                        }}
                        color="red"
                      >
                        Clear Tag
                      </DropdownMenu.Item>
                    </>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </Box>
          )}

          {user && (user.uid === conversation.owner || user.isRepoCollaborator || user.isAdmin) && (
            <ConversationListItemMenu conversation={conversation} />
          )}
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
        </Flex>
      </Grid>
    </div>
  )
}
