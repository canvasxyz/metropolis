/** @jsx jsx */

import React, { useEffect, useState, useRef } from "react"
import { connect } from "react-redux"
import { toast } from "react-hot-toast"
import { Box, Heading, Button, Text, Input, jsx } from "theme-ui"

import api from "../../util/api"
import type { Comment } from "../../util/types"
import { DropdownMenu } from "../../components/dropdown"
import { TbHeart, TbArrowBigUpLine, TbCheck, TbEdit, TbX } from "react-icons/tb"

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

  const animateOut = (el) =>
    new Promise<void>((resolve, reject) => {
      el.parentElement.parentElement.classList.add("animation-exit")
      setTimeout(() => resolve(), 400)
    })

  // returns promise {nextComment: {tid:...}} or {} if no further comments
  const agreeBoost = (commentId: string, event: MouseEvent) => {
    // ;(event.currentTarget as any).blur() // for editing past votes
    setVoting(true)
    api
      .post("api/v3/votes", {
        pid: "mypid",
        conversation_id: conversationId,
        agid: 1,
        weight: 1,
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

  const agree = (commentId: string, event: MouseEvent) => {
    // ;(event.currentTarget as any).blur() // for editing past votes
    setVoting(true)
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
        animateOut(event).then(() => {
          onVoted(commentId)
          setEditingVote(false)
        })
      })
      .always(() => setVoting(false))
  }

  const disagree = (commentId: string, event: MouseEvent) => {
    // ;(event.currentTarget as any).blur() // for editing past votes
    setVoting(true)
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
        animateOut(event).then(() => {
          onVoted(commentId)
          setEditingVote(false)
        })
      })
      .always(() => setVoting(false))
  }

  const skip = (commentId: string, event: MouseEvent) => {
    // ;(event.currentTarget as any).blur() // for editing past votes
    setVoting(true)
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
        borderRadius: "2px",
        bg: "bgOffWhite",
        boxShadow: "1px 1px 4px rgba(0,0,0,0.04)",
        width: "100%",
        px: ["24px", "32px"],
        pt: ["22px", "25px"],
        pb: ["16px", "19px"],
        overflow: "scroll",
      }}
    >
      <Box>
        <Text
          sx={{
            mb: [3],
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
                      { name: "Agree & Boost", onClick: (e) => agreeBoost(commentId, e.target) },
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
        <Box sx={{ marginLeft: "-15px" }}>
          <Button variant="text" onClick={(e) => agreeBoost(commentId, e.target)}>
            <img src="/boost.svg" width="18" sx={{ position: "relative", top: "3px", mr: [2] }} />
            {/*<TbArrowBigUpLine style={{ position: "relative", top: "4px" }} />*/}
            <Text sx={{ display: ["none", "inline"] }}>Agree & </Text>Boost
          </Button>
          <Button variant="text" onClick={(e) => agree(commentId, e.target)}>
            <img src="/agree.svg" width="18" sx={{ position: "relative", top: "3px", mr: [2] }} />
            {/*<TbCheck style={{ position: "relative", top: "4px" }} />*/}
            Agree
          </Button>
          <Button variant="text" onClick={(e) => disagree(commentId, e.target)}>
            <img
              src="/disagree.svg"
              width="18"
              sx={{ position: "relative", top: "2px", mr: [2] }}
            />
            {/*<TbX style={{ position: "relative", top: "4px" }} />*/}
            Disagree
          </Button>
          <Button variant="text" onClick={(e) => skip(commentId, e.target)}>
            Skip
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default SurveyCard
