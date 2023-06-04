import React, { useEffect, useState, useRef } from "react"
import { connect } from "react-redux"
import { Box, Heading, Button, Text, Input } from "theme-ui"

import api from "../util/api"
import type { Comment } from "../util/types"
import { DropdownMenu } from "../components/dropdown"
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
  const agree = (commentId: string, starred: boolean = undefined, weight = 0) => {
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
        onVoted(commentId)
        setEditingVote(false)
      })
      .always(() => setVoting(false))
  }
  const disagree = (commentId: string, starred: boolean = undefined, weight = 0) => {
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
        onVoted(commentId)
        setEditingVote(false)
      })
      .always(() => setVoting(false))
  }
  const skip = (tid: string, starred: boolean = undefined, weight = 0) => {
    setVoting(true)
    api
      .post("api/v3/votes", {
        pid: "mypid",
        conversation_id: conversationId,
        agid: 1,
        weight,
        vote: 0,
        tid: tid,
        // starred: boolean
      })
      .then(() => {
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
        height: "180px",
        px: "40px",
        py: "36px",
        // mb: [3, null, 4],
        mb: stacked ? "-177px" : undefined,
        overflow: "scroll",
      }}
    >
      <Text sx={{ mb: 4, wordBreak: "break-word" }}>{txt}</Text>
      {hasVoted && !editingVote ? (
        <Box sx={{ position: "absolute", top: [3], right: [3] }}>
          <DropdownMenu
            rightAlign
            options={[{ name: "Edit your vote", onClick: () => setEditingVote(true) }]}
          />
        </Box>
      ) : (
        <Box sx={{ position: "absolute", bottom: "36px" }}>
          <Button
            variant={editingVote ? "outline" : "primary"}
            sx={{ mr: 2 }}
            onClick={agree.bind(null, commentId)}
          >
            <TbCheck />
            &nbsp;Agree
          </Button>
          <Button
            variant={editingVote ? "outline" : "primary"}
            sx={{ mr: 2 }}
            onClick={disagree.bind(null, commentId)}
          >
            <TbX />
            &nbsp;Disagree
          </Button>
          <Button
            variant={editingVote ? "outline" : "primary"}
            sx={{ mr: 2 }}
            onClick={skip.bind(null, commentId)}
          >
            Skip
          </Button>
          {editingVote && (
            <Text
              sx={{
                display: "inline",
                fontFamily: "monospace",
                color: "lightGray",
                "&:hover": {
                  color: "primary",
                  borderBottom: "1.5px solid",
                  borderBottomColor: "primary",
                },
                cursor: "pointer",
                ml: 3,
                my: 2,
              }}
              onClick={() => setEditingVote(false)}
            >
              Cancel
            </Text>
          )}
        </Box>
      )}
    </Box>
  )
}

export default SurveyCard
