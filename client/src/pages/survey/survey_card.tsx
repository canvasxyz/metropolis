/** @jsx jsx */

import $ from "jquery"
import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toast } from "react-hot-toast"
import { Box, Button, Text, jsx } from "theme-ui"

import api from "../../util/api"
import type { Comment } from "../../util/types"
import { DropdownMenu } from "../../components/dropdown"

type SurveyCardProps = {
  comment: Comment
  conversationId: string
  onVoted: (commentId: string) => void
  hasVoted: boolean
  maxHeight?: number
}

const SurveyCard = ({ comment, conversationId, onVoted, hasVoted, maxHeight }: SurveyCardProps) => {
  const { tid: commentId, txt } = comment

  const [editingVote, setEditingVote] = useState(false)

  const animateOut = (target) =>
    new Promise<void>((resolve) => {
      $(target).closest(".survey-card").addClass("animation-exit")
      setTimeout(() => resolve(), 300)
    })

  // returns promise {nextComment: {tid:...}} or {} if no further comments
  const agree = (commentId: string, target: HTMLElement) => {
    // ;(event.currentTarget as any).blur() // for editing past votes
    api
      .post("api/v3/votes", {
        pid: "mypid",
        conversation_id: conversationId,
        agid: 1,
        weight: 0,
        vote: -1,
        tid: commentId,
        // starred: boolean
      })
      .then(() => {
        toast.success("Vote recorded")
        animateOut(target).then(() => {
          onVoted(commentId)
          setEditingVote(false)
        })
      })
  }

  const disagree = (commentId: string, target: HTMLElement) => {
    // ;(event.currentTarget as any).blur() // for editing past votes
    api
      .post("api/v3/votes", {
        pid: "mypid",
        conversation_id: conversationId,
        agid: 1,
        weight: 0,
        vote: 1,
        tid: commentId,
        // starred: boolean
      })
      .then(() => {
        toast.success("Vote recorded")
        animateOut(target).then(() => {
          onVoted(commentId)
          setEditingVote(false)
        })
      })
  }

  const skip = (commentId: string, target: HTMLElement) => {
    // ;(event.currentTarget as any).blur() // for editing past votes
    api
      .post("api/v3/votes", {
        pid: "mypid",
        conversation_id: conversationId,
        agid: 1,
        weight: 0,
        vote: 0,
        tid: commentId,
        // starred: boolean
      })
      .then(() => {
        toast.success("Skip recorded")
        animateOut(target).then(() => {
          onVoted(commentId)
          setEditingVote(false)
        })
      })
  }

  return (
    <Box
      className="survey-card"
      sx={{
        position: "relative",
        border: "1px solid",
        borderColor: "#ddd",
        borderRadius: "2px",
        bg: "bgOffWhite",
        boxShadow: "1px 1px 4px rgba(0,0,0,0.04)",
        maxHeight: maxHeight,
        width: "100%",
        px: ["24px", "32px"],
        pt: ["22px", "20px"],
        pb: ["46px", "36px"],
        overflow: "scroll",
      }}
    >
      <Box>
        <Text
          sx={{
            pb: [4],
            wordBreak: "break-word",
          }}
        >
          <Text className="react-markdown-card">
            <ReactMarkdown remarkPlugins={[remarkGfm]} linkTarget="_blank">
              {txt}
            </ReactMarkdown>
          </Text>
        </Text>
        {hasVoted && (
          <Box sx={{ position: "absolute", top: [3], right: [3] }}>
            <DropdownMenu
              rightAlign
              options={
                editingVote
                  ? [
                      { name: "Agree", onClick: (e) => agree(commentId, e.target) },
                      { name: "Disagree", onClick: (e) => disagree(commentId, e.target) },
                      { name: "Skip", onClick: (e) => skip(commentId, e.target) },
                      {
                        name: "Cancel",
                        onClick: () => setEditingVote(false),
                      },
                    ]
                  : [{ name: "Edit your vote", onClick: () => setEditingVote(true) }]
              }
            />
          </Box>
        )}
        <Box
          sx={{ position: "absolute", bottom: ["10px", "14px"], marginLeft: "-15px", pb: [2, 0] }}
        >
          <Button variant="text" onClick={(e) => agree(commentId, e.target)}>
            <img src="/agree.svg" width="18" sx={{ position: "relative", top: "3px", mr: [2] }} />
            Agree
          </Button>
          <Button variant="text" onClick={(e) => disagree(commentId, e.target)}>
            <img
              src="/disagree.svg"
              width="18"
              sx={{ position: "relative", top: "2px", mr: [2] }}
            />
            Disagree
          </Button>
          <Button variant="text" onClick={(e) => skip(commentId, e.target)}>
            Skip<Text sx={{ display: ["none", "inline"] }}> / Unsure</Text>
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default SurveyCard
