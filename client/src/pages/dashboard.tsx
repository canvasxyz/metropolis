/** @jsx jsx */

import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link as RouterLink } from "react-router-dom"
import { Heading, Box, Flex, Text, Button, jsx } from "theme-ui"
import { Conversation, RootState } from "../util/types"
import { populateConversationsStore } from "../actions"
import remarkGfm from "remark-gfm"
import remarkFrontMatter from "remark-frontmatter"
import ReactMarkdown from "react-markdown"
import { Frontmatter } from "./Frontmatter"


const Dashboard: React.FC<{ user? }> = ({ user }) => {
  const dispatch = useDispatch()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    dispatch(populateConversationsStore())
  }, [])

  const [selectedConversationId, setSelectedConversationId] = useState<string|null>(null)

  const data = useSelector((state: RootState) => state.conversations)
  const conversations = data.conversations as Array<Conversation> | null

  const selectedConversation = selectedConversationId && conversations !== null ? conversations.filter((conversation) => conversation.conversation_id == selectedConversationId)[0] : null

  return (
    <Box sx={{ height: "calc(100vh - 7px)" }}>
      <style>{"body { border-top: 5px solid #0090ff; border-image: none; }"}</style>
      <Flex sx={{ display: "flex", height: "100%" }}>
        <Box sx={{ width: ["40%", null, "260px"], borderRight: "1px solid #ddd" }}>
          <Box sx={{ width: "100%", borderBottom: "1px solid #ddd", py: [3], px: [4] }}>
            <RouterLink to="/">
              <Text variant="links.a" sx={{ fontWeight: 500, display: "inline" }}>
                Metropolis
              </Text>
            </RouterLink>{" "}
            / FIPs
          </Box>
          <Box sx={{ px: [4], pt: [3] }}>
            {(conversations||[]).map(
              (conversation) =>
              <Box
                sx={{
                  fontWeight: conversation.conversation_id == selectedConversationId ? 600:200,
                  mt: [2],
                  pb: [1],
                  borderBottom: "1px solid #ddd",
                  cursor: "pointer",
                  userSelect: "none"
                }}
                onClick={() => setSelectedConversationId(conversation.conversation_id)}
                key={conversation.conversation_id}
              >
                {conversation.topic}
              </Box>)
              }
            {/* <Box sx={{ mt: [2], pb: [1] }}>
              <Box sx={{ mb: [2] }}>▾ Open FIPs</Box>
              <Box sx={{ ml: [3] }}>
                <Box sx={{ fontWeight: "600" }}>FIP-0100</Box>
                <Box>FIP-0101</Box>
              </Box>
            </Box>
            <Box sx={{ mt: [2] }}>
              <Box sx={{ mb: [2] }}>▾ Closed FIPs</Box>
              <Box sx={{ ml: [3] }}>
                <Box>FIP-0102</Box>
                <Box>FIP-0103</Box>
              </Box>
            </Box> */}
          </Box>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ margin: "0 auto", pt: [6, 7], px: [4], maxWidth: "720px" }}>
            <Box sx={{ position: "absolute", top: [3], right: [3] }}>
              <Button variant="outline" sx={{ my: [1], px: [2], py: [1] }}>
                View analysis
              </Button>
            </Box>
            {selectedConversation !== null ? <Box>
              <Heading as="h2">{selectedConversation.topic}</Heading>
              <Frontmatter source={selectedConversation.description} />
              <ReactMarkdown
                children={selectedConversation.description}
                remarkPlugins={[remarkGfm, [remarkFrontMatter, {type: "yaml", marker: "-"}]]}
              />
              <Box>
                <Box sx={{ fontWeight: "500" }}>Temperature Check</Box>
                <Box sx={{ my: [3], px: [3], py: [3], border: "1px solid #ddd" }}>
                  Insert poll here
                </Box>
              </Box>
            </Box> : <Box>Select a conversation</Box>}
          </Box>
        </Box>
      </Flex>
    </Box>
  )
}

export default Dashboard
