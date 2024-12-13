import React, { useEffect, useState, useRef } from "react"
import { Box, Heading, Button, Flex, Text, TextArea, Card, Dialog } from "@radix-ui/themes"

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
    <Card>
      <Flex gap="3" direction="column">
        <Heading size="5">
          Create a sentiment check
        </Heading>

        <Flex gap="1" direction="column">
          <label htmlFor="title">
            <Heading size="3">Title</Heading>
          </label>
          <TextArea
            name="title"
            placeholder={"e.g. What communications channels should our group use?"}
            onChange={(i) => {
              setTitle(i.target.value)
            }}
            autoFocus
            defaultValue={title}
          />
        </Flex>

        <Flex gap="1" direction="column">
          <label htmlFor="description">
            <Heading size="3">Description (Markdown)</Heading>
          </label>
          <TextArea
            id="new_conversation_description"
            name="description"
            ref={descriptionRef}
            placeholder={`Explain why this question matters to the community, and provide any relevant context or history.

Try to be objective in the description. You can add specific opinions as responses later.`}
            rows={8}
            onChange={(i) => {
              setDescription(i.target.value)
            }}
            defaultValue={description}
          />
        </Flex>

        <Dialog.Close>
          <Button
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
            Create poll
          </Button>
        </Dialog.Close>

        { error && <Text color="red" weight="medium">{error}</Text> }
      </Flex>
    </Card>
  )
}

export const CreateConversationDialog = () => {
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button>Create a poll</Button>
      </Dialog.Trigger>

      <Dialog.Content maxWidth="450px">
        <CreateConversationInner />
      </Dialog.Content>
    </Dialog.Root>
  )
}
