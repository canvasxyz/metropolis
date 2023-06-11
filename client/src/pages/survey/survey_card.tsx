/** @jsx jsx */

import React, { useEffect, useState, useRef } from "react"
import { connect } from "react-redux"
import { toast } from "react-hot-toast"
import { Box, Heading, Button, Text, Input, jsx } from "theme-ui"

import api from "../../util/api"
import type { Comment } from "../../util/types"
import { DropdownMenu } from "../../components/dropdown"
import { TbCheck, TbEdit, TbX } from "react-icons/tb"

type SurveyCardProps = {
  comment: Comment
  conversationId: string
  onVoted: Function
  hasVoted: boolean
  stacked: boolean
}

const SurveyCard = ({ comment, conversationId, onVoted, hasVoted, stacked }: SurveyCardProps) => {
  const { tid: commentId, txt, created, pid } = comment

  const [voting, setVoting] = useState(false)
  const [editingVote, setEditingVote] = useState(false)
  const [important, setImportant] = useState<boolean>()

  const animateOut = (el) =>
    new Promise<void>((resolve, reject) => {
      el.parentElement.classList.add("animation-exit")
      setTimeout(() => resolve(), 400)
    })

  // returns promise {nextComment: {tid:...}} or {} if no further comments
  const agree = (commentId: string, event: MouseEvent, important: boolean) => {
    // ;(event.currentTarget as any).blur() // for editing past votes
    setVoting(true)
    api
      .post("api/v3/votes", {
        pid: "mypid",
        conversation_id: conversationId,
        agid: 1,
        weight: important ? 1 : 0,
        vote: -1,
        tid: commentId,
        // starred: boolean
      })
      .then(() => {
        toast.success("Vote recorded")
        animateOut(event).then(() => {
          onVoted(commentId)
          setEditingVote(false)
        })
      })
      .always(() => setVoting(false))
  }

  const disagree = (commentId: string, event: MouseEvent, important: boolean) => {
    // ;(event.currentTarget as any).blur() // for editing past votes
    setVoting(true)
    api
      .post("api/v3/votes", {
        pid: "mypid",
        conversation_id: conversationId,
        agid: 1,
        weight: important ? 1 : 0,
        vote: 1,
        tid: commentId,
        // starred: boolean
      })
      .then(() => {
        toast.success("Vote recorded")
        animateOut(event).then(() => {
          onVoted(commentId)
          setEditingVote(false)
        })
      })
      .always(() => setVoting(false))
  }

  const skip = (commentId: string, event: MouseEvent, important: boolean) => {
    // ;(event.currentTarget as any).blur() // for editing past votes
    setVoting(true)
    api
      .post("api/v3/votes", {
        pid: "mypid",
        conversation_id: conversationId,
        agid: 1,
        weight: important ? 1 : 0,
        vote: 0,
        tid: commentId,
        // starred: boolean
      })
      .then(() => {
        toast.success("Skip recorded")
        animateOut(event).then(() => {
          onVoted(commentId)
          setEditingVote(false)
        })
      })
      .always(() => setVoting(false))
  }

  return (
    <Box
      sx={{
        position: "relative",
        border: "1px solid",
        borderColor: "#ddd",
        borderRadius: "8px",
        bg: "background",
        boxShadow: "1px 1px 4px rgba(0,0,0,0.04)",
        width: "100%",
        mb: "20px",
        px: ["24px", "40px"],
        pt: ["20px", "30px"],
        pb: ["18px", "28px"],
        overflow: "scroll",
      }}
    >
      <Text
        sx={{
          mb: 4,
          wordBreak: "break-word",
        }}
      >
        {txt}
      </Text>
      {hasVoted && (
        <Box sx={{ position: "absolute", top: [3], right: [3] }}>
          <DropdownMenu
            rightAlign
            options={
              editingVote
                ? [
                    { name: "Agree", onClick: (e) => agree(commentId, e.target, important) },
                    { name: "Disagree", onClick: (e) => disagree(commentId, e.target, important) },
                    { name: "Skip", onClick: (e) => skip(commentId, e.target, important) },
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
      <Button
        variant="outlineGreen"
        sx={{ mr: 2, color: "mediumGray", px: [2, 3], py: [1, 2] }}
        onClick={(e) => agree(commentId, e.target, important)}
      >
        <TbCheck style={{ position: "relative", top: "2px" }} />
        &nbsp;Agree
      </Button>
      <Button
        variant="outlineRed"
        sx={{ mr: 2, color: "mediumGray", px: [2, 3], py: [1, 2] }}
        onClick={(e) => disagree(commentId, e.target, important)}
      >
        <TbX style={{ position: "relative", top: "2px" }} />
        &nbsp;Disagree
      </Button>
      <Button
        variant="outlineGray"
        sx={{ mr: 2, color: "mediumGray", px: [2, 3], py: [1, 2] }}
        onClick={(e) => skip(commentId, e.target, important)}
      >
        Skip
      </Button>
      <Box sx={{ mt: "12px", fontSize: "0.94em", color: "mediumGray", fontFamily: "monospace" }}>
        <label>
          <input type="checkbox" onChange={(e) => setImportant(e.target.checked)} />
          &nbsp;This option is important to me
        </label>
      </Box>
    </Box>
  )
}

export default SurveyCard
