/** @jsx jsx */

import _ from "lodash"
import React, { Fragment, useState, useRef, useLayoutEffect } from "react"
import { Box, Heading, Button, Text, Textarea, Link, Flex, jsx } from "theme-ui"
import { TbExternalLink } from "react-icons/tb"

import { surveyBox, surveyHeadingMini } from "./index"
import SurveyCard from "./survey_card"

const PrefilledComment = ({ text, last }: { text: string; last?: boolean }) => {
  return (
    <Box
      sx={{
        bg: "bgOffWhite",
        border: "1px solid #e2ddd5",
        borderRadius: "7px",
        mb: [1],
        pt: "12px",
        pb: "10px",
        px: "15px",
        display: "flex",
      }}
    >
      <Text sx={{ flex: 1 }}>{text}</Text>
      <Button
        variant="text"
        sx={{
          background: "mediumGreen !important",
          my: "-3px",
          py: [1],
          px: [2],
          fontSize: "0.94em",
          "&:hover": { bg: "mediumGreenActive !important" },
        }}
        onClick={() => {
          const box: HTMLTextAreaElement = document.querySelector(
            "textarea[placeholder='Add a comment']",
          )
          if (!box) return

          box.value = text.replace("...", " ")
          box.focus()
        }}
      >
        {text.endsWith("...") ? (
          <Fragment>
            <img src="/comment.svg" width="14" sx={{ position: "relative", top: "2px", mr: [1] }} />
            Comment
          </Fragment>
        ) : (
          <Fragment>
            <img src="/agree.svg" width="15" sx={{ position: "relative", top: "2px", mr: [1] }} />
            Agree
          </Fragment>
        )}
      </Button>
    </Box>
  )
}

export const PrefilledComments = () => {
  return (
    <Box sx={{ lineHeight: 1.3 }}>
      <PrefilledComment text="This seems unobjectionable to me." />
      <PrefilledComment text="We should verify this has support from..." last />
      <PrefilledComment text="There could be unexpected side effects if..." />
      <PrefilledComment text="This proposal would benefit from review by..." />
    </Box>
  )
}

const SurveyCards = ({
  user,
  conversation_id,
  votedComments,
  unvotedComments,
  setVotedComments,
  submittedComments,
  setSubmittedComments,
  onVoted,
  goTo,
  zid_metadata,
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
    <Box sx={{ position: "relative" }}>
      {unvotedComments.length > 0 && (
        <Box sx={{ position: "relative", ...surveyBox }}>
          {unvotedComments.length > 0 && (
            <Box>
              <Text
                sx={{
                  fontSize: "0.9em",
                  mb: "12px",
                  color: "#9f9e9b",
                  fontWeight: 500,
                  textAlign: "center",
                }}
              >
                Vote on crowdsourced statements about this proposal:
              </Text>
            </Box>
          )}
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
            <Box
              sx={{
                position: "absolute",
                fontSize: "0.9em",
                color: "mediumGray",
                textAlign: "right",
                zIndex: 9999,
                mt: [1],
                right: [3],
                top: [2],
              }}
            >
              {unvotedComments.length > 25 ? "25+" : unvotedComments.length} remaining
            </Box>
            {unvotedComments.length > 1 &&
              _.reverse(unvotedComments.slice(1, 5)).map((comment, index) => {
                return (
                  <Box
                    key={comment.tid}
                    sx={{
                      zIndex: -1,
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transition: "0.2s ease-in-out",
                      transform:
                        index === 0
                          ? "rotate(-0.25deg)"
                          : index === 1
                          ? "rotate(0.25deg) translate(2px, 0)"
                          : index === 2
                          ? "rotate(-0.65deg)"
                          : index === 3
                          ? "rotate(0.65deg translate(-3px, 0))"
                          : index === 4
                          ? "rotate(-1deg translate(-1px, 0))"
                          : "rotate(1deg)",
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
        </Box>
      )}
      {unvotedComments.length === 0 && votedComments.length === 0 && (
        <Box sx={{ ...surveyBox }}>
          <Text
            sx={{
              fontSize: "0.9em",
              mb: "10px",
              color: "#9f9e9b",
              fontWeight: 500,
              textAlign: "center",
            }}
          >
            Nobody has commented on this proposal yet. Be the first:
          </Text>
          <PrefilledComments />
        </Box>
      )}

      {unvotedComments.length === 0 && votedComments.length !== 0 && (
        <React.Fragment>
          <Box sx={{ ...surveyBox }}>
            <Text
              sx={{
                fontSize: "0.9em",
                mb: "10px",
                color: "#9f9e9b",
                fontWeight: 500,
                textAlign: "center",
              }}
            >
              Nice work! You’ve voted on every comment, but you can still add more:
            </Text>
            <PrefilledComments />
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
