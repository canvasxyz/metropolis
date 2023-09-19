import React, { useEffect, useState, useRef } from "react"

import Modal from "react-modal"
import { useDispatch } from "react-redux";
import { Box, Input, Textarea, Label, Heading, Button, Text, Flex, jsx } from "theme-ui"
import {
  handleCreateConversationSubmit,
} from "../actions"

type PropTypes = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void
}


const CreateConversationInner = ({ dispatch }) => {
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
    <Box sx={{ mt: [4, null, 5], mb: [5] }}>
      <Flex>
        <Heading as="h1" sx={{ flex: 1, position: "relative", top: "4px" }}>
          Add a survey
        </Heading>
      </Flex>

      <Box sx={{ mt: 5, mb: 6 }}>
        <Box>
          <Label sx={{ display: "block", mb: [5] }}>
            <Box sx={{ fontWeight: "700", mb: [1] }}>Title</Box>
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
            <Flex sx={{flexDirection: "row", alignItems: "center"}}>
              <Text sx={{ flexGrow: "1", fontWeight: "700", mb: [1] }}>
                <label htmlFor="new_conversation_description">Body</label>
              </Text>
              {/* TODO: implement FIP search */}
              <Button>Search FIPs...</Button>
            </Flex>
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

export const CreateConversationModal: React.FC<PropTypes> = ({isOpen, setIsOpen}) => {
  const dispatch = useDispatch()

  return <Modal
    isOpen={isOpen}
    onRequestClose={() => setIsOpen(false)}
    style={{
      overlay: {
        backgroundColor: "rgba(40, 40, 40, 0.3)",
      },
      content: {
        borderRadius: "8px",
        top: "50%",
        left: "50%",
        right: "auto",
        bottom: "auto",
        marginRight: "-50%",
        transform: "translate(-50%, -50%)",
        minHeight: "200px",
        width: "96vw", // for mobile
        maxWidth: "540px",
        overflow: "visible",
        padding: "32px 28px 28px",
      },
    }}
    contentLabel="Add new statement"
  >
    <CreateConversationInner dispatch={dispatch} />
  </Modal>
}
