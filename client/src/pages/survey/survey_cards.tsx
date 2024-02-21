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
  const [cardHeight, setCardHeight] = useState<number>()

  useLayoutEffect(() => {
    if (!cardsBoxRef.current) return
    const h =
      Math.max(
        cardsBoxRef.current.children[0].scrollHeight,
        cardsBoxRef.current.children[0].clientHeight,
      ) + 4
    setCardHeight(h)
  }, [votedComments.length])

  const commentStack = _.reverse(unvotedComments.slice(1, 5))

  return (
    <Box sx={{ position: "relative", minHeight: Math.max(120, (cardHeight ?? 100) + 10) }}>
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
                cardHeight={cardHeight}
              />
            )}
            {unvotedComments.length > 1 &&
              commentStack.map((comment, index) => {
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
                      cardHeight={cardHeight}
                      topCard={index === commentStack.length - 1}
                    />
                  </Box>
                )
              })}
          </Box>
        </Box>
      )}
      {unvotedComments.length === 0 && votedComments.length === 0 && (
        <Box sx={{ ...surveyBox, padding: "50px 32px", fontWeight: 500, fontSize: "0.94em" }}>
          No responses for this {zid_metadata.fip_author ? "FIP" : "discussion"} yet.
        </Box>
      )}

      {unvotedComments.length === 0 && votedComments.length !== 0 && (
        <React.Fragment>
          <Box sx={{ ...surveyBox, padding: "50px 32px", fontWeight: 500, fontSize: "0.94em" }}>
            You’ve voted on all {votedComments.length} responses so far.
            <br />
            Come back later for more to vote on, or add your own.
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
