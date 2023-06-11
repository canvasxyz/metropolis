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

  // returns promise {nextComment: {tid:...}} or {} if no further comments
  const agree = (
    commentId: string,
    event: MouseEvent,
    starred: boolean = undefined,
    weight = 0,
    f
  ) => {
    ;(event.currentTarget as any).blur()
    setVoting(true)
    api
      .post("api/v3/votes", {
        pid: "mypid",
        conversation_id: conversationId,
        agid: 1,
        weight,
        vote: -1,
        tid: commentId,
        // starred: boolean
      })
      .then(() => {
        toast.success("Vote recorded")
        onVoted(commentId)
        setEditingVote(false)
      })
      .always(() => setVoting(false))
  }

  const disagree = (
    commentId: string,
    event: MouseEvent,
    starred: boolean = undefined,
    weight = 0
  ) => {
    ;(event.currentTarget as any).blur()
    setVoting(true)
    api
      .post("api/v3/votes", {
        pid: "mypid",
        conversation_id: conversationId,
        agid: 1,
        weight,
        vote: 1,
        tid: commentId,
        // starred: boolean
      })
      .then(() => {
        toast.success("Vote recorded")
        onVoted(commentId)
        setEditingVote(false)
      })
      .always(() => setVoting(false))
  }

  const skip = (commentId: string, event: MouseEvent, starred: boolean = undefined, weight = 0) => {
    ;(event.currentTarget as any).blur()
    setVoting(true)
    api
      .post("api/v3/votes", {
        pid: "mypid",
        conversation_id: conversationId,
        agid: 1,
        weight,
        vote: 0,
        tid: commentId,
        // starred: boolean
      })
      .then(() => {
        toast.success("Skip recorded")
        onVoted(commentId)
        setEditingVote(false)
      })
      .always(() => setVoting(false))
  }

  return (
    <Box
      sx={{
        position: "relative",
        border: "1px solid",
        borderColor: "lighterGray",
        borderRadius: "8px",
        bg: "background",
        boxShadow: "1px 1px 4px rgba(0,0,0,0.04)",
        width: "100%",
        height: [null, "350px"],
        mb: "20px",
        px: [4, "40px"],
        pt: [4, "36px"],
        pb: "16px",
        overflow: "scroll",
      }}
    >
      <Text sx={{ mb: 4, minHeight: [null, "170px"], wordBreak: "break-word" }}>{txt}</Text>
      {hasVoted && (
        <Box sx={{ position: "absolute", top: [3], right: [3] }}>
          <DropdownMenu
            rightAlign
            options={
              editingVote
                ? [
                    { name: "Agree", onClick: agree.bind(null, commentId) },
                    { name: "Disagree", onClick: disagree.bind(null, commentId) },
                    { name: "Skip", onClick: skip.bind(null, commentId) },
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
        sx={{ mr: 2, color: "mediumGray" }}
        onClick={agree.bind(null, commentId)}
      >
        <TbCheck style={{ position: "relative", top: "2px" }} />
        &nbsp;Agree
      </Button>
      <Button
        variant="outlineRed"
        sx={{ mr: 2, color: "mediumGray" }}
        onClick={disagree.bind(null, commentId)}
      >
        <TbX style={{ position: "relative", top: "2px" }} />
        &nbsp;Disagree
      </Button>
      <Button
        variant="outlineGray"
        sx={{ mr: 2, color: "mediumGray" }}
        onClick={skip.bind(null, commentId)}
      >
        Skip
      </Button>
      <Box sx={{ mt: "12px", fontSize: "0.94em", color: "mediumGray", fontFamily: "monospace" }}>
        <label>
          <input type="checkbox" onChange={() => false} />
          &nbsp;This option is important to me
        </label>
      </Box>
    </Box>
  )
}

export default SurveyCard
