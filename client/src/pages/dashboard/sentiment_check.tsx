/** @jsx jsx */

import React, { useState } from "react"
import { Button, Box, Flex, jsx } from "theme-ui"
import { useLocalStorage } from "@uidotdev/usehooks"
import { TbCheck, TbChevronDown, TbChevronUp } from "react-icons/tb"

import api from "../../util/api"

const SUPPORT_VOTE = "support"
const OPPOSE_VOTE = "oppose"
const NEUTRAL_VOTE = "neutral"

export const SentimentCheck: React.FC<{ user; zid_metadata }> = ({
  user,
  zid_metadata,
}: {
  user: { githubUsername: string }
  zid_metadata
}) => {
  const [supported, setSupported] = useState(() =>
    zid_metadata.sentiment.filter((v) => v.vote === SUPPORT_VOTE).map((v) => v.github_username),
  )
  const [opposed, setOpposed] = useState(() =>
    zid_metadata.sentiment.filter((v) => v.vote === OPPOSE_VOTE).map((v) => v.github_username),
  )
  const [neutral, setNeutral] = useState(() =>
    zid_metadata.sentiment.filter((v) => v.vote === NEUTRAL_VOTE).map((v) => v.github_username),
  )

  const [updating, setUpdating] = useState(false)

  const [showSupportingUsers, setShowSupportingUsers] = useState(false)
  const [showNeutralUsers, setShowNeutralUsers] = useState(false)
  const [showOpposedUsers, setShowOpposedUsers] = useState(false)

  const isSupported = supported.find((u: string) => u === user?.githubUsername)
  const isOpposed = opposed.find((u: string) => u === user?.githubUsername)
  const isNeutral = neutral.find((u: string) => u === user?.githubUsername)

  const activeStyles = { opacity: 0.7, pointerEvents: "none" }
  const supportedStyles = isSupported ? activeStyles : {}
  const opposedStyles = isOpposed ? activeStyles : {}
  const neutralStyles = isNeutral ? activeStyles : {}

  const voteSupport = (e) => {
    e.preventDefault()
    if (supported.find((u: string) => u === user.githubUsername)) {
      setSupported(supported.filter((u: string) => u !== user.githubUsername))
      return
    }
    setUpdating(true)
    api
      .post("/api/v3/conversation/sentiment", {
        conversation_id: zid_metadata.conversation_id,
        vote: SUPPORT_VOTE,
      })
      .then(() => {
        setSupported([...supported, user.githubUsername])
        setOpposed(opposed.filter((u: string) => u !== user.githubUsername))
        setNeutral(neutral.filter((u: string) => u !== user.githubUsername))
      })
      .always(() => setUpdating(false))
  }
  const voteOppose = (e) => {
    e.preventDefault()
    if (opposed.find((u: string) => u === user.githubUsername)) {
      setOpposed(opposed.filter((u: string) => u !== user.githubUsername))
      return
    }
    setUpdating(true)
    api
      .post("/api/v3/conversation/sentiment", {
        conversation_id: zid_metadata.conversation_id,
        vote: OPPOSE_VOTE,
      })
      .then(() => {
        setOpposed([...opposed, user.githubUsername])
        setSupported(supported.filter((u: string) => u !== user.githubUsername))
        setNeutral(neutral.filter((u: string) => u !== user.githubUsername))
      })
      .always(() => setUpdating(false))
  }
  const voteNeutral = (e) => {
    e.preventDefault()
    if (neutral.find((u: string) => u === user.githubUsername)) {
      setNeutral(neutral.filter((u: string) => u !== user.githubUsername))
      return
    }
    setUpdating(true)
    api
      .post("/api/v3/conversation/sentiment", {
        conversation_id: zid_metadata.conversation_id,
        vote: NEUTRAL_VOTE,
      })
      .then(() => {
        setNeutral([...neutral, user.githubUsername])
        setOpposed(opposed.filter((u: string) => u !== user.githubUsername))
        setSupported(supported.filter((u: string) => u !== user.githubUsername))
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
            ...supportedStyles,
          }}
          onClick={voteSupport}
        >
          Support {isSupported && <TbCheck />}
        </Button>
        <Box
          sx={{ fontSize: "0.94em", mt: [2], cursor: "pointer" }}
          onClick={() => {
            setShowSupportingUsers(!showSupportingUsers)
          }}
        >
          {supported.length} supporting
          <Box
            sx={{
              display: "inline",
              position: "relative",
              ml: "2px",
              top: "2px",
            }}
          >
            {showSupportingUsers ? <TbChevronUp /> : <TbChevronDown />}
          </Box>
        </Box>
        {showSupportingUsers && (
          <Box sx={{ fontSize: "0.9em", mt: [1] }}>
            {supported.map((u: string) => (
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
            ...opposedStyles,
          }}
          onClick={voteOppose}
        >
          Oppose {isOpposed && <TbCheck />}
        </Button>
        <Box
          sx={{ fontSize: "0.94em", mt: [2], cursor: "pointer" }}
          onClick={() => {
            setShowOpposedUsers(!showOpposedUsers)
          }}
        >
          {opposed.length} opposed
          <Box
            sx={{
              display: "inline",
              position: "relative",
              ml: "2px",
              top: "2px",
            }}
          >
            {showOpposedUsers ? <TbChevronUp /> : <TbChevronDown />}
          </Box>
          {showOpposedUsers && (
            <Box sx={{ fontSize: "0.9em", mt: [1] }}>
              {opposed.map((u: string) => (
                <Box key={u}>{u}</Box>
              ))}
            </Box>
          )}
        </Box>
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
            bg: "mediumGray",
            "&:hover": { bg: "mediumGrayActive" },
            ...neutralStyles,
          }}
          onClick={voteNeutral}
        >
          Neutral {isNeutral && <TbCheck />}
        </Button>
        <Box
          sx={{ fontSize: "0.94em", mt: [2], cursor: "pointer" }}
          onClick={() => {
            setShowNeutralUsers(!showNeutralUsers)
          }}
        >
          {neutral.length} neutral
          <Box
            sx={{
              display: "inline",
              position: "relative",
              ml: "2px",
              top: "2px",
            }}
          >
            {showNeutralUsers ? <TbChevronUp /> : <TbChevronDown />}
          </Box>
        </Box>
        {showNeutralUsers && (
          <Box sx={{ fontSize: "0.9em", mt: [1] }}>
            {neutral.map((u: string) => (
              <Box key={u}>{u}</Box>
            ))}
          </Box>
        )}
      </Box>
    </Flex>
  )
}
