import React, { useEffect, useState, useRef } from "react"
import Modal from "react-modal"
import { Box, Input, Textarea, Label, Heading, Button, Flex } from "theme-ui"

import { handleCreateConversationSubmit } from "../actions"
import { useAppDispatch } from "../hooks"

const CreateConversationInner = () => {
  const dispatch = useAppDispatch()
  const descriptionRef = useRef()

  const [title, setTitle] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [error, setError] = useState<string>()

  useEffect(() => {
    window.onpopstate = onpopstate
    history.replaceState("select", null, "")
    return () => {
      window.removeEventListener("onpopstate", onpopstate, false)
    }
  }, [])

  return (
    <Box>
      <Flex>
        <Heading as="h2" sx={{ flex: 1, position: "relative", top: "4px" }}>
          Create a discussion
        </Heading>
      </Flex>

      <Box sx={{ mt: 5 }}>
        <Box>
          <Label sx={{ display: "block", fontWeight: 600, mb: [5] }}>
            <Box sx={{ mb: [1] }}>Title</Box>
            <Input
              placeholder={"e.g. What communications channels should our group use?"}
              onChange={(i) => {
                setTitle(i.target.value)
              }}
              autoFocus
              defaultValue={title}
            />
          </Label>
          <form>
            <Label sx={{ display: "block", fontWeight: 600, mb: [4] }}>
              <Box sx={{ mb: [1] }}>Description (Markdown)</Box>
              <Textarea
                id="new_conversation_description"
                ref={descriptionRef}
                placeholder={`Explain why this question matters to the community, and provide any relevant context or history.

Try to be objective in the description. You can add specific opinions as responses later.`}
                rows={8}
                onChange={(i) => {
                  setDescription(i.target.value)
                }}
                defaultValue={description}
              ></Textarea>
            </Label>
          </form>
          <Button
            variant="primary"
            onClick={() => {
              if (title.trim().length === 0) {
                setError("Title can't be empty")
                return
              } else if (description.trim().length === 0) {
                setError("Please write a longer description")
                return
              }
              setError("")
              dispatch(handleCreateConversationSubmit(title, description, true))
            }}
          >
            Create discussion
          </Button>
        </Box>
        {error && <Box sx={{ color: "mediumRedActive", fontWeight: 500, mt: [3] }}>{error}</Box>}
      </Box>
    </Box>
  )
}

export const CreateConversationModal = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={() => setIsOpen(false)}
      style={{
        content: {
          backgroundColor: "#fffcf5",
          border: "1px #EDEBE3",
          boxShadow: "4px 4px 8px 2px #E6E0D4",
          borderRadius: "8px",
          top: "50%",
          left: "50%",
          right: "auto",
          bottom: "auto",
          marginRight: "-50%",
          transform: "translate(-50%, -50%)",
          width: "96vw", // for mobile
          maxWidth: "540px",
          overflow: "visible",
          padding: "32px 48px 28px",
        },
      }}
      contentLabel="Add new statement"
    >
      <CreateConversationInner />
    </Modal>
  )
}
