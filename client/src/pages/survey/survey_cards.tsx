/** @jsx jsx */

import React, { useState, useRef, useLayoutEffect } from "react"
import { Box, Heading, Button, Text, Textarea, Flex, jsx } from "theme-ui"
import { TbExternalLink } from "react-icons/tb"

import { surveyBox, surveyHeadingMini } from "./index"
import SurveyCard from "./survey_card"

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
  const mainRef = useRef()
  const firstCardRef = useRef()
  useLayoutEffect(() => {
    if (mainRef.current && firstCardRef.current) {
      ;(mainRef.current as any).style.maxHeight =
        (firstCardRef.current as any).offsetHeight + 100 + "px"
    }
  }, [votedComments.length])

  return (
    <Box>
      {unvotedComments.length > 0 && (
        <Box
          ref={mainRef}
          sx={{
            position: "relative",
            maxHeight: "300px",
            overflow: "hidden",
            pb: "40px",
            mb: "40px",
          }}
        >
          {unvotedComments[0] && (
            <Box ref={firstCardRef}>
              <SurveyCard
                key={unvotedComments[0].tid}
                comment={unvotedComments[0]}
                conversationId={conversation_id}
                onVoted={onVoted}
                hasVoted={false}
                stacked={true}
              />
            </Box>
          )}
          {unvotedComments[1] && (
            <SurveyCard
              key={unvotedComments[1].tid}
              comment={unvotedComments[1]}
              conversationId={conversation_id}
              onVoted={onVoted}
              hasVoted={false}
              stacked={true}
            />
          )}
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              l: 0,
              width: "100%",
              textAlign: "center",
              pt: "120px",
              pointerEvents: "none",
              backgroundImage: `
  linear-gradient(
    to bottom,
    hsla(0, 0%, 100%, 0) 0%,
    hsla(0, 0%, 100%, 0.013) 8.1%,
    hsla(0, 0%, 100%, 0.049) 15.5%,
    hsla(0, 0%, 100%, 0.104) 22.5%,
    hsla(0, 0%, 100%, 0.175) 29%,
    hsla(0, 0%, 100%, 0.259) 35.3%,
    hsla(0, 0%, 100%, 0.352) 41.2%,
    hsla(0, 0%, 100%, 0.45) 47.1%,
    hsla(0, 0%, 100%, 0.55) 52.9%,
    hsla(0, 0%, 100%, 0.648) 58.8%,
    hsla(0, 0%, 100%, 0.741) 64.7%,
    hsla(0, 0%, 100%, 0.825) 71%,
    hsla(0, 0%, 100%, 0.896) 77.5%,
    hsla(0, 0%, 100%, 0.951) 84.5%,
    hsla(0, 0%, 100%, 0.987) 91.9%,
    hsl(0, 0%, 100%) 100%
  )`,
            }}
          ></Box>
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              l: 0,
              width: "100%",
              textAlign: "center",
              pt: "0px",
            }}
          >
            <Text
              sx={{
                display: "inline-block",
                borderRadius: "9999px",
                p: "2px 12px 1px",
                fontFamily: "monospace",
                fontSize: "0.92em",
                color: "lightGrayActive",
                bg: "lighterGray",
              }}
            >
              {unvotedComments.length > 1 &&
              zid_metadata.postsurvey_limit &&
              zid_metadata.postsurvey_limit - votedComments.length - submittedComments.length > 0
                ? `${
                    zid_metadata.postsurvey_limit - votedComments.length - submittedComments.length
                  } more`
                : unvotedComments.length > 1
                ? `${unvotedComments.length - 1} cards left`
                : "Last card"}
            </Text>
          </Box>
        </Box>
      )}
      {unvotedComments.length === 0 && votedComments.length === 0 && (
        <Box sx={{ ...surveyBox, pt: [5] }}>
          <Heading as="h3" sx={{ ...surveyHeadingMini, fontSize: "22px" }}>
            No statements
          </Heading>
          <Text sx={{ mb: [3] }}>
            Nobody has added any statements to this survey yet. If adding statements is enabled, you
            could be the first!
          </Text>
        </Box>
      )}

      {unvotedComments.length === 0 && (
        <React.Fragment>
          <Box sx={{ ...surveyBox, pt: [5] }}>
            <Heading as="h3" sx={{ ...surveyHeadingMini, fontSize: "22px" }}>
              You’re done for now!
            </Heading>
            <Text sx={{ mb: [2] }}>
              You’ve voted on all {votedComments.length} statements submitted so far.
            </Text>
            <Text sx={{ mb: [2] }}>
              Come back to this page to see new statements as they’re written by others.
            </Text>
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
