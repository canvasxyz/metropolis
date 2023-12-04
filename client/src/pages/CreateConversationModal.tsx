import React, { useEffect, useState, useRef } from "react"

import Modal from "react-modal"
import { useDispatch } from "react-redux"
import { Box, Input, Textarea, Label, Heading, Button, Flex } from "theme-ui"
import { handleCreateConversationSubmit } from "../actions"

type PropTypes = {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
}

const CreateConversationInner = () => {
  const dispatch = useDispatch()
  const descriptionRef = useRef()

  const [title, setTitle] = useState<string>()
  const [description, setDescription] = useState<string>()

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
          Add a survey
        </Heading>
      </Flex>

      <Box sx={{ mt: 5 }}>
        <Box>
          <Label sx={{ display: "block", mb: [5] }}>
            <Box sx={{ mb: [1] }}>Title</Box>
            <Box>
              <Input
                placeholder={"Placeholder title"}
                onChange={(i) => {
                  setTitle(i.target.value)
                }}
                defaultValue={title}
              />
            </Box>
          </Label>
          <form>
            <Box>
              <Textarea
                id="new_conversation_description"
                ref={descriptionRef}
                placeholder="Markdown supported"
                rows={8}
                onChange={(i) => {
                  setDescription(i.target.value)
                }}
                defaultValue={description}
              ></Textarea>
            </Box>
          </form>
          <Button
            variant="primary"
            onClick={() => {
              dispatch(handleCreateConversationSubmit(title, description))
            }}
          >
            Create survey
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export const CreateConversationModal = ({ isOpen, setIsOpen }: PropTypes) => {
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
