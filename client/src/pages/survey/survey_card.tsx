/** @jsx jsx */

import $ from "jquery"
import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toast } from "react-hot-toast"
import { Box, Button, Text, jsx } from "theme-ui"
import { TbThumbUp, TbThumbDown } from "react-icons/tb"

import api from "../../util/api"
import type { Comment } from "../../util/types"
import { DropdownMenu } from "../../components/dropdown"

type SurveyCardProps = {
  comment: Comment
  conversationId: string
  onVoted: (commentId: string) => void
  hasVoted: boolean
  cardHeight?: number
  topCard?: boolean
  zid_metadata
}

const SurveyCard = ({
  comment,
  conversationId,
  onVoted,
  hasVoted,
  cardHeight,
  topCard,
  zid_metadata,
}: SurveyCardProps) => {
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
        minHeight: cardHeight,
        maxHeight: topCard ? "" : cardHeight,
        width: "100%",
        px: ["24px", "32px"],
        pt: "16px",
        pb: "56px",
        overflow: "scroll",
      }}
    >
      <Box>
        <Text sx={{ display: "block", wordBreak: "break-word", pb: [2] }}>
          <Box sx={{ fontSize: "0.93em", opacity: 0.8, mb: "12px" }}>
            {/*<img
              src={`https://github.com/${comment.github_username}.png`}
              width="20"
              height="20"
              style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 6 }}
            />
            <Text sx={{ position: "relative", top: "-4px", ml: "6px" }}>
              {comment.github_username ?? "Anonymous"}
              </Text>*/}
          </Box>
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
          sx={{ position: "absolute", bottom: ["10px", "20px"], marginLeft: "-2px", pb: [2, 0] }}
        >
          <Button
            variant={zid_metadata.auth_needed_to_write ? "voteDisabled" : "vote"}
            onClick={(e: any) => agree(commentId, e.target)}
            sx={{ mr: [2] }}
          >
            <TbThumbUp style={{ width: 18, color: "#2fcc71", position: "relative", top: 1 }} />{" "}
            Agree
          </Button>
          <Button
            variant={zid_metadata.auth_needed_to_write ? "voteDisabled" : "vote"}
            onClick={(e: any) => disagree(commentId, e.target)}
            sx={{ mr: [2] }}
          >
            <TbThumbDown style={{ width: 18, color: "#e74b3c", position: "relative", top: 2 }} />{" "}
            Disagree
          </Button>
          <Button
            variant={zid_metadata.auth_needed_to_write ? "voteDisabled" : "vote"}
            onClick={(e: any) => skip(commentId, e.target)}
            sx={{ mr: [2] }}
          >
            Skip
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default SurveyCard
