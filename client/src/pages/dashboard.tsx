/** @jsx jsx */

import React, { useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link, Link as RouterLink, useHistory } from "react-router-dom"
import { Heading, Box, Flex, Text, Button, jsx } from "theme-ui"
import { Conversation, RootState } from "../util/types"
import { populateConversationsStore } from "../actions"
import remarkGfm from "remark-gfm"
import remarkFrontMatter from "remark-frontmatter"
import ReactMarkdown from "react-markdown"
import { Frontmatter } from "./Frontmatter"
import Survey from "./survey"
import { TbSettings } from "react-icons/tb"
import { CreateConversationModal } from "./CreateConversationModal"


const Dashboard: React.FC<{ user?: any; selectedConversationId: string | null }> = ({ user, selectedConversationId }) => {
  const dispatch = useDispatch()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    dispatch(populateConversationsStore())
  }, [])

  const hist = useHistory()
  const data = useSelector((state: RootState) => state.conversations)
  const conversations: Array<Conversation> = data.conversations || []
  const { zid_metadata } = useSelector((state: RootState) => state.zid_metadata)

  const [showOpenConversations, setShowOpenConversations] = useState(true)
  const [showArchivedConversations, setShowArchivedConversations] = useState(true)

  const [createConversationModalIsOpen, setCreateConversationModalIsOpen] = useState(false)

  const navigateToConversation = useCallback((conversationId) => {
    console.log(conversationId)
    hist.push(`/dashboard/c/${conversationId}`)
  },[])

  const selectedConversation = selectedConversationId !== null ? conversations.filter((conversation) => conversation.conversation_id == selectedConversationId)[0] : null

  const openConversations = conversations.filter((conversation) => !conversation.is_archived)
  const archivedConversations = conversations.filter((conversation) => conversation.is_archived)

  return (
    <Box sx={{ height: "calc(100vh - 7px)" }}>
      <style>{"body { border-top: 5px solid #0090ff; border-image: none; }"}</style>
      <Flex sx={{ display: "flex", height: "100%" }}>
        <Box sx={{ overflowY:"scroll", width: ["40%", null, "340px"], borderRight: "1px solid #ddd" }}>
          <Flex sx={{ width: "100%", borderBottom: "1px solid #ddd", py: [3], px: [4], alignItems:"center" }}>
            <Box sx={{flexGrow: "1"}}>
              <RouterLink to="/">
                <Text variant="links.a" sx={{ fontWeight: 500, display: "inline" }}>
                  Metropolis
                </Text>
              </RouterLink>{" "}
              / FIPs
            </Box>

            <Button variant="outlineSecondary" onClick={() => setCreateConversationModalIsOpen(true)}>
              Add survey
            </Button>
          </Flex>
          <Box>
            <Box
              sx={{
                fontWeight: 500,
                py: [2],
                px: [3],
                cursor: "pointer",
                userSelect: "none",
                "&:hover": {
                  backgroundColor: "#F5EEDB"
                }
              }}
              onClick={() => setShowOpenConversations(!showOpenConversations)}
            >
              {showOpenConversations ? "▾" : "▸"} Open Surveys ({openConversations.length})
            </Box>
            {showOpenConversations && openConversations.map(
              (conversation) =>
              <Box
                sx={{
                  p: [3],
                  pl: [6],
                  cursor: "pointer",
                  userSelect: "none",
                  backgroundColor: conversation.conversation_id == selectedConversationId ? "#F5EEDB": "#FBF5E9",
                  "&:hover": {
                    backgroundColor: conversation.conversation_id == selectedConversationId ? "#F5EEDB" : "#F8F2E2"
                  }
                }}
                onClick={() => navigateToConversation(conversation.conversation_id)}
                key={conversation.conversation_id}
              >
                <Text sx={{fontWeight: 500}}>#{conversation.github_pr_id} - {conversation.fip_title || conversation.github_pr_title}</Text>
                <Flex sx={{direction: "row"}}>
                  <Text sx={{color: "#84817D", flexGrow:"1"}}>{conversation.fip_type}</Text>
                  <Text sx={{color: "#84817D"}}>{conversation.github_pr_submitter}</Text>
                </Flex>

              </Box>)
            }
            <Box
              sx={{
                fontWeight: 500,
                py: [2],
                px: [3],
                cursor: "pointer",
                userSelect: "none",
                "&:hover": {
                  backgroundColor: "#F5EEDB"
                }
              }}
              onClick={() => setShowArchivedConversations(!showArchivedConversations)}
            >
              {showArchivedConversations ? "▾" : "▸"} Past Surveys ({archivedConversations.length})
            </Box>
            {showArchivedConversations && archivedConversations.map(
              (conversation) =>
              <Box
                sx={{
                  fontWeight: 500,
                  p: [3],
                  pl: [6],
                  cursor: "pointer",
                  userSelect: "none",
                  backgroundColor: conversation.conversation_id == selectedConversationId ? "#F5EEDB": "#FBF5E9",
                  "&:hover": {
                    backgroundColor: conversation.conversation_id == selectedConversationId ? "#F5EEDB" : "#F8F2E2"
                  }
                }}
                onClick={() => navigateToConversation(conversation.conversation_id)}
                key={conversation.conversation_id}
              >
                {conversation.topic}
              </Box>)
            }
          </Box>
        </Box>
        <Box sx={{ overflowY:"scroll", flex: 1 }}>
          {!!selectedConversation
            ? <Box>
                <Box sx={{width: "100%", borderBottom: "1px solid #ddd" }}>
                  {(zid_metadata.is_mod || zid_metadata.is_owner) && (
                    <Button
                      variant="outlineSecondary"
                      sx={{ position: "absolute", top: [4], right: [4], alignItems: "center", display: "flex", gap:[1]
                     }}
                      onClick={() => hist.push(`/m/${zid_metadata.conversation_id}`)}
                    >
                      <Box><TbSettings/></Box>
                      <Text>Edit</Text>
                    </Button>
                  )}
                  <Flex sx={{ flexDirection: "column", gap: [2], margin: "0 auto", pt: [6, 7], px:[4], maxWidth: "720px"}}>
                    <Heading as="h2">{selectedConversation.fip_title || selectedConversation.github_pr_title}</Heading>
                    <Text>
                      Pull request: #<a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`https://github.com/filecoin-project/FIPs/pull/${selectedConversation.github_pr_id}`}
                      >{selectedConversation.github_pr_id}</a>
                    </Text>
                    <Frontmatter conversation={selectedConversation} />
                    <Box>
                      <ReactMarkdown
                        children={selectedConversation.description}
                        skipHtml={true}
                        remarkPlugins={[remarkGfm, [remarkFrontMatter, {type: "yaml", marker: "-"}]]}
                        linkTarget="_blank"
                      />
                    </Box>
                  </Flex>
                </Box>
                <Box sx={{width: "100%", position: "relative"}}>
                  <Box sx={{ position: "absolute", top: [4], right: [4], px: [2], pt: "4px", pb: "3px", display:"flex", flex:"1", flexDirection: "row", gap:[2] }}>
                  {(zid_metadata.is_mod || zid_metadata.is_owner) && (
                  <Button
                    variant="outlineSecondary"
                    onClick={() => hist.push(`/m/${zid_metadata.conversation_id}/comments`)}
                  >
                    Moderate
                  </Button>
                  )}
                  {(zid_metadata.is_mod || zid_metadata.is_owner) && (
                  <Button
                    variant="outlineSecondary"
                    onClick={() => hist.push(`/m/${zid_metadata.conversation_id}/report`)}
                  >
                    Results
                  </Button>
                  )}

                  </Box>
                <Box
                  sx={{
                    margin: "0 auto",
                    maxWidth: "720px",
                    px: [4],
                    py: [2],
                    lineHeight: 1.45,
                  }}
                >
                  <Text sx={{
                    color: "primary", textTransform: "uppercase", fontFamily: "heading",
                    fontWeight: 400
                  }}>
                  Community Response
                  </Text>
                  <Survey match={{params: {conversation_id: selectedConversation.conversation_id}}}/>
                </Box>
                </Box>
              </Box>
            :
              <Flex sx={{  justifyContent: "center", alignItems:"center", height: "100%"
               }}>
                <Flex sx={{margin: "auto", flexDirection: "column", alignItems: "center"}}>
                  <img
                    src="/foundation.png"
                    width="200"
                    style={{ opacity: 0.2 }}
                  />
                  <h1 sx={{mt:[1], opacity: 0.7}}>
                    Select a survey
                  </h1>
                </Flex>
              </Flex>
          }
        </Box>
      </Flex>
      <CreateConversationModal
        isOpen={createConversationModalIsOpen}
        setIsOpen={setCreateConversationModalIsOpen}
      />
    </Box>
  )
}

export default Dashboard
