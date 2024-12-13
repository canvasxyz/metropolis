import $ from "jquery"
import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toast } from "react-hot-toast"
import { Box, Button, Flex, Text } from "@radix-ui/themes"
import { TbThumbUp, TbThumbDown } from "react-icons/tb"

import api from "../../util/api"
import type { Comment } from "../../util/types"

type SurveyCardProps = {
  comment: Comment
  conversationId: string
  onVoted: (commentId: string) => void
  hasVoted: boolean
  cardHeight?: number
  topCard?: boolean
  voteDisabled: boolean
}

const SurveyCard = ({
  comment,
  conversationId,
  onVoted,
  hasVoted,
  cardHeight,
  topCard,
  voteDisabled,
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
      position="relative"
      minHeight={`${cardHeight}`}
      maxHeight={topCard ? "" : `${cardHeight}`}
      width="100%"
      px={{initial:"24px", sm: "32px"}}
      py="16px"
      pb="24px"
      style={{
        border: "1px solid",
        borderColor: "#ddd",
        borderRadius: "2px",
        backgroundColor: "white",
        boxShadow: "1px 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <Box>
        <Text className="react-markdown-card">
          <ReactMarkdown remarkPlugins={[remarkGfm]} linkTarget="_blank">
            {txt}
          </ReactMarkdown>
        </Text>
        <Flex pt="2" gap="2">
          <Button
            disabled={voteDisabled}
            color="gold"
            variant="soft"
            onClick={(e: any) => {
              e.stopPropagation()
              agree(commentId, e.target)
            }}
          >
            <TbThumbUp style={{ width: 18, color: "#2fcc71", position: "relative", top: 1 }} />{" "}
            Agree
          </Button>
          <Button
            disabled={voteDisabled}
            color="gold"
            variant="soft"
            onClick={(e: any) => {
              e.stopPropagation()
              disagree(commentId, e.target)
            }}
          >
            <TbThumbDown style={{ width: 18, color: "#e74b3c", position: "relative", top: 2 }} />{" "}
            Disagree
          </Button>
          <Button
            disabled={voteDisabled}
            color="gold"
            variant="soft"
            onClick={(e: any) => {
              e.stopPropagation()
              skip(commentId, e.target)
            }}
          >
            Skip
          </Button>
        </Flex>
      </Box>
    </Box>
  )
}

export default SurveyCard
