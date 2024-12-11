import React, { useState } from "react"
import { Button, Box, Text, Flex, Grid } from "@radix-ui/themes"
import {
  TbCheck,
  TbChevronDown,
  TbChevronUp,
  TbMoodSmileBeam,
  TbMoodSad,
} from "react-icons/tb"

import api from "../../util/api"
import { ZidMetadata } from "../../util/types"

const LIKE_VOTE = "like"
const DISLIKE_VOTE = "dislike"

export const SentimentCheck = ({
  user,
  zid_metadata,
}: {
  user?: { isAdmin: boolean; isRepoCollaborator: boolean; githubUsername: string; uid?: number }
  zid_metadata: ZidMetadata
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

  const activeStyles = { opacity: 0.7 }
  const likedStyles = isLiked ? activeStyles : {}
  const dislikedStyles = isDisliked ? activeStyles : {}

  const voteLike = (e) => {
    e.preventDefault()
    if (liked.find((u: string) => u === user?.githubUsername)) {
      setLiked(liked.filter((u: string) => u !== user?.githubUsername))
      return
    }
    setUpdating(true)
    api
      .post("/api/v3/conversation/sentiment", {
        conversation_id: zid_metadata.conversation_id,
        vote: LIKE_VOTE,
      })
      .then(() => {
        setLiked([...liked, user?.githubUsername])
        setDisliked(disliked.filter((u: string) => u !== user?.githubUsername))
      })
      .always(() => setUpdating(false))
  }
  const voteDislike = (e) => {
    e.preventDefault()
    if (disliked.find((u: string) => u === user?.githubUsername)) {
      setDisliked(disliked.filter((u: string) => u !== user?.githubUsername))
      return
    }
    setUpdating(true)
    api
      .post("/api/v3/conversation/sentiment", {
        conversation_id: zid_metadata.conversation_id,
        vote: DISLIKE_VOTE,
      })
      .then(() => {
        setDisliked([...disliked, user?.githubUsername])
        setLiked(liked.filter((u: string) => u !== user?.githubUsername))
      })
      .always(() => setUpdating(false))
  }

  return (
    <Box>
      <Grid columns="2" gap="2">
        <Box mt="6px" flexGrow="1">
          <Button
            color="gold"
            variant="soft"
            style={{
              height: "36px",
              width: "100%",
              fontSize: "0.98em",
              fontWeight: 500,
              opacity: !user?.uid ? "0.5" : 1,
              pointerEvents: !user?.uid ? "none" : undefined,
              ...likedStyles,
            }}
            onClick={voteLike}
          >
            <Flex direction="row" align="center" gap="2">
              <TbMoodSmileBeam
                style={{ width: 18, color: "#2fcc71", position: "relative", top: 0 }}
              />{" "}
              {!user?.uid ? (
                <Text>Login required</Text>
              ) : (
                <Text>Positive {isLiked && <TbCheck />}</Text>
              )}
            </Flex>
          </Button>
          <Flex
            justify="center"
            mt="1"
            onClick={() => {
              setShowLikedUsers(!showLikedUsers)
            }}
          >
            {liked.length} positive
            {user && (user.isRepoCollaborator || user.isAdmin) && (
              <Box
                display="inline"
                position="relative"
                ml="2px"
                top="2px"
              >
                {showLikedUsers ? <TbChevronUp /> : <TbChevronDown />}
              </Box>
            )}
          </Flex>
          {user && (user.isRepoCollaborator || user.isAdmin) && showLikedUsers && (
            <Box mt="1">
              {liked.map((u: string) => (
                <Box key={u}>{u}</Box>
              ))}
            </Box>
          )}
        </Box>
        <Box mt="6px" flexGrow="1">
          <Button
            color="gold"
            variant="soft"
            style={{
              height: "36px",
              width: "100%",
              fontSize: "0.98em",
              fontWeight: 500,
              opacity: !user?.uid ? "0.5" : 1,
              pointerEvents: !user?.uid ? "none" : undefined,
              ...dislikedStyles,
            }}
            onClick={voteDislike}
          >
            <Flex direction="row" align="center" gap="2">
              <TbMoodSad style={{ width: 18, color: "#e74b3c", position: "relative", top: 0 }} />{" "}
              {!user?.uid ? (
                <Text>Login required</Text>
              ) : (
                <Text>Negative {isDisliked && <TbCheck />}</Text>
              )}
            </Flex>
          </Button>
          <Flex
            mt="1"
            justify="center"
            onClick={() => {
              setShowDislikedUsers(!showDislikedUsers)
            }}
          >
            {disliked.length} negative
            {user && (user.isRepoCollaborator || user.isAdmin) && (
              <Box
                display="inline"
                position="relative"
                ml="2px"
                top="2px"
              >
                {showDislikedUsers ? <TbChevronUp /> : <TbChevronDown />}
              </Box>
            )}
          </Flex>
          {user && (user.isRepoCollaborator || user.isAdmin) && showDislikedUsers && (
            <Box mt="1">
              {disliked.map((u: string) => (
                <Box key={u}>{u}</Box>
              ))}
            </Box>
          )}
        </Box>
      </Grid>
      {!user && (
        <Box mt="18px">
          <Button
            color="gold"
            style={{ width: "100%" }}
            variant="outline"
            onClick={() =>
              (document.location = `/api/v3/github_oauth_init?dest=${window.location.href}`)
            }
          >
            Sign in with Github to record your sentiment
          </Button>
        </Box>
      )}
    </Box>
  )
}
