import React from "react"
import { ConversationSummary } from "../../reducers/conversations_summary"
import { useNavigate } from "react-router-dom-v5-compat"
import { handleCloseConversation, handleReopenConversation } from "../../actions"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { TbArchive, TbArchiveOff, TbDots, TbHammer, TbPencil } from "react-icons/tb"
import { Box, DropdownMenu, IconButton } from "@radix-ui/themes"

const ConversationListItemMenu = ({conversation}: {conversation: ConversationSummary}) => {
  const { user } = useAppSelector((state) => state.user)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const canCloseConversation = user && (
    user.uid === conversation.owner ||
    user.isRepoCollaborator ||
    user.isAdmin
  )

  return <Box
    position="absolute"
    top="13px"
    right="13px"
    onClick={(e) => e.stopPropagation()}
  >
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton variant="ghost" size="1">
          <TbDots />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/m/${conversation.conversation_id}`)
          }}
        >
          <TbPencil /> Edit
        </DropdownMenu.Item>

        <DropdownMenu.Item
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/m/${conversation.conversation_id}/comments`)
          }}
        >
          <TbHammer /> Moderate comments
        </DropdownMenu.Item>

        {
          canCloseConversation &&
          <DropdownMenu.Item
            onClick={() => {
              if (conversation.is_archived) {
                if (!confirm("Reopen this discussion?")) return
                dispatch(handleReopenConversation(conversation.conversation_id))
                location.reload()
              } else {
                if (!confirm("Close this discussion?")) return
                dispatch(handleCloseConversation(conversation.conversation_id))
                location.reload()
              }
            }}
          >
            {conversation.is_archived ? <TbArchiveOff /> : <TbArchive />}{" "}
            {conversation.is_archived ? "Reopen" : "Close"}
          </DropdownMenu.Item>
        }
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Box>
}

export default ConversationListItemMenu
