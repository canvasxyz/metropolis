/** @jsx jsx */

import _ from "lodash"
import React, { Fragment, useState, useRef, useLayoutEffect } from "react"
import { Box, Button, Text, jsx } from "theme-ui"
import { TbExternalLink } from "react-icons/tb"

import { surveyBox } from "./index"
import SurveyCard from "./survey_card"

const SurveyCards = ({
  conversation_id,
  votedComments,
  unvotedComments,
  onVoted,
  goTo,
  zid_metadata,
  user,
}: {
  conversation_id
  votedComments
  unvotedComments
  onVoted
  goTo
  zid_metadata
  user
}) => {
  const cardsBoxRef = useRef<HTMLElement>()
  const [maxHeight, setMaxHeight] = useState<number>()

  useLayoutEffect(() => {
    if (!cardsBoxRef.current) return
    const maxh =
      Math.max(
        cardsBoxRef.current.children[0].scrollHeight,
        cardsBoxRef.current.children[0].clientHeight,
      ) + 4
    setMaxHeight(maxh)
  }, [votedComments.length])

  return (
    <Box sx={{ position: "relative", minHeight: "120px" }}>
      {unvotedComments.length > 0 && (
        <Box sx={{ position: "relative" }}>
          <Box sx={{ position: "relative" }} ref={cardsBoxRef}>
            {unvotedComments[0] && (
              <SurveyCard
                key={unvotedComments[0].tid}
                comment={unvotedComments[0]}
                conversationId={conversation_id}
                onVoted={onVoted}
                hasVoted={false}
                maxHeight={maxHeight}
              />
            )}
            {unvotedComments.length > 1 &&
              _.reverse(unvotedComments.slice(1, 5)).map((comment, index) => {
                return (
                  <Box
                    key={comment.tid}
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transition: "0.2s ease-in-out",
                      transform:
                        index === 0
                          ? "rotate(-0.15deg)"
                          : index === 1
                          ? "rotate(0.15deg) translate(2px, 0)"
                          : index === 2
                          ? "rotate(-0.25deg)"
                          : index === 3
                          ? "rotate(0.25deg translate(-3px, 0))"
                          : index === 4
                          ? "rotate(-0.5deg translate(-1px, 0))"
                          : "rotate(0.5deg)",
                    }}
                  >
                    <SurveyCard
                      comment={comment}
                      conversationId={conversation_id}
                      onVoted={onVoted}
                      hasVoted={false}
                      maxHeight={maxHeight}
                    />
                  </Box>
                )
              })}
          </Box>
          <Box sx={{ position: "absolute", top: [3], right: [4], fontSize: "0.94em" }}>
            {unvotedComments.length > 0 && (
              <Box>{unvotedComments.length > 25 ? "25+" : unvotedComments.length} remaining</Box>
            )}
          </Box>
        </Box>
      )}
      {unvotedComments.length === 0 && votedComments.length === 0 && (
        <Box sx={{ ...surveyBox, padding: "70px 32px 70px", fontWeight: 500 }}>
          No notes on this {zid_metadata.fip_author ? "FIP" : "discussion"} yet.
        </Box>
      )}

      {unvotedComments.length === 0 && votedComments.length !== 0 && (
        <React.Fragment>
          <Box sx={{ ...surveyBox, padding: "70px 32px 70px", fontWeight: 500 }}>
            You’ve voted on all {votedComments.length} notes so far.
          </Box>
          {(zid_metadata.postsurvey || zid_metadata.postsurvey_redirect) && (
            <Button
              variant="primary"
              onClick={() =>
                zid_metadata.postsurvey
                  ? goTo("postsurvey")
                  : window.open(zid_metadata.postsurvey_redirect)
              }
              sx={{ width: "100%", mb: [3] }}
            >
              Go to next steps
              {!zid_metadata.postsurvey && (
                <TbExternalLink style={{ marginLeft: "5px", position: "relative", top: "2px" }} />
              )}
            </Button>
          )}
        </React.Fragment>
      )}
    </Box>
  )
}

export default SurveyCards
