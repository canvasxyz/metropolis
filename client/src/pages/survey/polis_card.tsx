/** @jsx jsx */

import $ from "jquery"
import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toast } from "react-hot-toast"
import { Box, Flex, Button, Text, jsx } from "theme-ui"
import { TbThumbUp, TbThumbDown } from "react-icons/tb"

import api from "../../util/api"
import type { Comment } from "../../util/types"
import { DropdownMenu } from "../../components/dropdown"

type PolisSurveyCardProps = {
  comment: Comment
  conversationId: string
  onVoted: (commentId: string) => void
  hasVoted: boolean
  voteDisabled: boolean
}

export const PolisSurveyCard = ({
  comment,
  conversationId,
  onVoted,
  hasVoted,
  voteDisabled,
}: PolisSurveyCardProps) => {
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
    <Flex
      className="survey-card"
      sx={{
        position: "relative",
        border: "1px solid",
        borderColor: "#ddd",
        borderRadius: "2px",
        bg: "bgWhite",
        boxShadow: "1px 1px 4px rgba(0,0,0,0.04)",
        minHeight: 140,
        overflow: "scroll",
        width: "100%",
        px: ["24px", "32px"],
        py: ["16px"],
        pb: ["24px"],
        flexDirection: "column",
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Text sx={{ display: "block", wordBreak: "break-word", pb: [2] }}>
          <Box sx={{ fontSize: "0.93em", opacity: 0.8, mb: "12px" }}>
            {/* <img
              src={`https://github.com/${comment.github_username}.png`}
              width="20"
              height="20"
              style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 6 }}
            />
            <Text sx={{ position: "relative", top: "-4px", ml: "6px" }}>
              {comment.github_username ?? "Anonymous"}
              </Text> */}
          </Box>
          <Text className="react-markdown-card" sx={{ fontSize: "1.1em" }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} linkTarget="_blank">
              {txt}
            </ReactMarkdown>
          </Text>
        </Text>
      </Box>
      <Box>
        {hasVoted && (
          <Box>
            <DropdownMenu
              rightAlign
              options={
                editingVote
                  ? [
                      { name: "Agree", onClick: (e) => {
                        e.stopPropagation()
                        agree(commentId, e.target)
                      } },
                      { name: "Disagree", onClick: (e) => {
                        e.stopPropagation()
                        disagree(commentId, e.target)
                      } },
                      { name: "Skip", onClick: (e) => {
                        e.stopPropagation()
                        skip(commentId, e.target)
                      } },
                      {
                        name: "Cancel",
                        onClick: (e) => {
                          e.stopPropagation()
                          setEditingVote(false)
                        },
                      },
                    ]
                  : [{ name: "Edit your vote", onClick: () => setEditingVote(true) }]
              }
            />
          </Box>
        )}
        <Box sx={{ pt: [2] }}>
          <Button
            variant={voteDisabled ? "voteDisabled" : "vote"}
            onClick={(e: any) => {
              e.stopPropagation()
              agree(commentId, e.target)
            }}
            sx={{ mr: [0, 0, 2], mb: [1, 1, 0], width: ["100%", undefined, "initial"] }}
          >
            <TbThumbUp style={{ width: 18, color: "#2fcc71", position: "relative", top: 1 }} />{" "}
            Agree
          </Button>
          <Button
            variant={voteDisabled ? "voteDisabled" : "vote"}
            onClick={(e: any) => {
              e.stopPropagation()
              disagree(commentId, e.target)
            }}
            sx={{ mr: [0, 0, 2], mb: [1, 1, 0], width: ["100%", undefined, "initial"] }}
          >
            <TbThumbDown style={{ width: 18, color: "#e74b3c", position: "relative", top: 2 }} />{" "}
            Disagree
          </Button>
          <Button
            variant={voteDisabled ? "voteDisabled" : "vote"}
            onClick={(e: any) => {
              e.stopPropagation()
              skip(commentId, e.target)
            }}
            sx={{ mr: [0, 0, 2], mb: [1, 1, 0], width: ["100%", undefined, "initial"] }}
          >
            Skip
          </Button>
        </Box>
      </Box>
    </Flex>
  )
}
