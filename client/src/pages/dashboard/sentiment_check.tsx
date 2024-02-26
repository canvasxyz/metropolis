/** @jsx jsx */

import React, { useState } from "react"
import { Button, Box, Flex, jsx } from "theme-ui"
import { useLocalStorage } from "@uidotdev/usehooks"
import { TbCheck, TbChevronDown, TbChevronUp } from "react-icons/tb"

import api from "../../util/api"

const LIKE_VOTE = "like"
const DISLIKE_VOTE = "dislike"

export const SentimentCheck: React.FC<{ user; zid_metadata }> = ({
  user,
  zid_metadata,
}: {
  user: { githubUsername: string }
  zid_metadata
}) => {
  const [liked, setLiked] = useState(() =>
    zid_metadata.sentiment.filter((v) => v.vote === LIKE_VOTE).map((v) => v.github_username),
  )
  const [disliked, setDisliked] = useState(() =>
    zid_metadata.sentiment.filter((v) => v.vote === DISLIKE_VOTE).map((v) => v.github_username),
  )

  const [updating, setUpdating] = useState(false)

  const [showLikedUsers, setShowLikedUsers] = useState(false)
  const [showDislikedUsers, setShowDislikedUsers] = useState(false)

  const isLiked = liked.find((u: string) => u === user?.githubUsername)
  const isDisliked = disliked.find((u: string) => u === user?.githubUsername)

  const activeStyles = { opacity: 0.7, pointerEvents: "none" }
  const likedStyles = isLiked ? activeStyles : {}
  const dislikedStyles = isDisliked ? activeStyles : {}

  const voteLike = (e) => {
    e.preventDefault()
    if (liked.find((u: string) => u === user.githubUsername)) {
      setLiked(liked.filter((u: string) => u !== user.githubUsername))
      return
    }
    setUpdating(true)
    api
      .post("/api/v3/conversation/sentiment", {
        conversation_id: zid_metadata.conversation_id,
        vote: LIKE_VOTE,
      })
      .then(() => {
        setLiked([...liked, user.githubUsername])
        setDisliked(disliked.filter((u: string) => u !== user.githubUsername))
      })
      .always(() => setUpdating(false))
  }
  const voteDislike = (e) => {
    e.preventDefault()
    if (disliked.find((u: string) => u === user.githubUsername)) {
      setDisliked(disliked.filter((u: string) => u !== user.githubUsername))
      return
    }
    setUpdating(true)
    api
      .post("/api/v3/conversation/sentiment", {
        conversation_id: zid_metadata.conversation_id,
        vote: DISLIKE_VOTE,
      })
      .then(() => {
        setDisliked([...disliked, user.githubUsername])
        setLiked(liked.filter((u: string) => u !== user.githubUsername))
      })
      .always(() => setUpdating(false))
  }

  return (
    <Flex sx={{ gap: [2] }}>
      <Box sx={{ flex: 1, textAlign: "center" }}>
        <Button
          variant="primary"
          sx={{
            border: "transparent",
            color: "white",
            py: "6px",
            px: "10px",
            width: "100%",
            fontSize: "0.98em",
            fontWeight: 500,
            bg: "mediumGreen",
            "&:hover": { bg: "mediumGreenActive" },
            mr: "8px",
            ...likedStyles,
          }}
          onClick={voteLike}
        >
          Like {isLiked && <TbCheck />}
        </Button>
        <Box
          sx={{ fontSize: "0.94em", mt: [2], cursor: "pointer" }}
          onClick={() => {
            setShowLikedUsers(!showLikedUsers)
          }}
        >
          {liked.length} liked
          <Box
            sx={{
              display: "inline",
              position: "relative",
              ml: "2px",
              top: "2px",
            }}
          >
            {showLikedUsers ? <TbChevronUp /> : <TbChevronDown />}
          </Box>
        </Box>
        {showLikedUsers && (
          <Box sx={{ fontSize: "0.9em", mt: [1] }}>
            {liked.map((u: string) => (
              <Box key={u}>{u}</Box>
            ))}
          </Box>
        )}
      </Box>
      <Box sx={{ flex: 1, textAlign: "center" }}>
        <Button
          variant="primary"
          sx={{
            border: "transparent",
            color: "white",
            py: "6px",
            px: "10px",
            width: "100%",
            fontSize: "0.98em",
            fontWeight: 500,
            bg: "mediumRed",
            "&:hover": { bg: "mediumRedActive" },
            ...dislikedStyles,
          }}
          onClick={voteDislike}
        >
          Dislike {isDisliked && <TbCheck />}
        </Button>
        <Box
          sx={{ fontSize: "0.94em", mt: [2], cursor: "pointer" }}
          onClick={() => {
            setShowDislikedUsers(!showDislikedUsers)
          }}
        >
          {disliked.length} disliked
          <Box
            sx={{
              display: "inline",
              position: "relative",
              ml: "2px",
              top: "2px",
            }}
          >
            {showDislikedUsers ? <TbChevronUp /> : <TbChevronDown />}
          </Box>
          {showDislikedUsers && (
            <Box sx={{ fontSize: "0.9em", mt: [1] }}>
              {disliked.map((u: string) => (
                <Box key={u}>{u}</Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Flex>
  )
}
