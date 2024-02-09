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
          Open a discussion
        </Heading>
      </Flex>

      <Box sx={{ mt: 5 }}>
        <Box>
          <Label sx={{ display: "block", mb: [5] }}>
            <Box sx={{ mb: [4] }}>
              Use this form to add a custom sentiment check, for topics that don't fit in a PR.
            </Box>
            <Box sx={{ mb: [1] }}>Title</Box>
            <Input
              placeholder={"What would you like to ask about?"}
              onChange={(i) => {
                setTitle(i.target.value)
              }}
              autoFocus
              defaultValue={title}
            />
          </Label>
          <form>
            <Label sx={{ display: "block", mb: [4] }}>
              <Box sx={{ mb: [1] }}>Description</Box>
              <Textarea
                id="new_conversation_description"
                ref={descriptionRef}
                placeholder="Explain why you’re polling the community for a sentiment check. Ask for ideas or opinions."
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
              if (title.trim().length < 20) {
                setError("Title should be at least 20 characters")
                return
              } else if (description.trim().length < 20) {
                setError("Description should be at least 100 characters")
                return
              }
              setError("")
              dispatch(handleCreateConversationSubmit(title, description, true))
            }}
          >
            Create survey
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
        overlay: {
          backgroundColor: "#FBF5E9A0",
        },
        content: {
          backgroundColor: "#FAF5EA",
          border: "1px #EDEBE3",
          boxShadow: "4px 4px 8px 2px #E6E0D4",
          borderRadius: "8px",
          top: "50%",
          left: "50%",
          right: "auto",
          bottom: "auto",
          marginRight: "-50%",
          transform: "translate(-50%, -50%)",
          // minHeight: "200px",
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
