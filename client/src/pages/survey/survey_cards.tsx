/** @jsx jsx */

import _ from "lodash"
import React, { Fragment, useState, useRef, useLayoutEffect } from "react"
import { Box, Button, Text, jsx } from "theme-ui"
import { TbExternalLink } from "react-icons/tb"

import { surveyBox } from "./index"
import SurveyCard from "./survey_card"

const PrefilledComment = ({ zid_metadata, text }: { zid_metadata; text: string }) => {
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
        <Fragment>
          <img src="/comment.svg" width="14" sx={{ position: "relative", top: "2px", mr: [1] }} />
          Comment
        </Fragment>
      </Button>
    </Box>
  )
}

export const PrefilledComments = ({ zid_metadata }: { zid_metadata }) => {
  return (
    <Box sx={{ lineHeight: 1.3 }}>
      <PrefilledComment text="This seems unobjectionable to me." zid_metadata={zid_metadata} />
      <PrefilledComment
        text="Another way to accomplish this might be..."
        zid_metadata={zid_metadata}
      />
      <PrefilledComment
        text="We should make sure this has support from..."
        zid_metadata={zid_metadata}
      />
      <PrefilledComment
        text="This proposal would benefit from review by..."
        zid_metadata={zid_metadata}
      />
    </Box>
  )
}

const SurveyCards = ({
  conversation_id,
  votedComments,
  unvotedComments,
  onVoted,
  goTo,
  zid_metadata,
}: {
  conversation_id
  votedComments
  unvotedComments
  onVoted
  goTo
  zid_metadata
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
            <Box
              sx={{
                display: "flex",
                fontSize: "0.9em",
                mb: "12px",
                color: "#9f9e9b",
                fontWeight: 500,
              }}
            >
              <Text sx={{ flex: 1 }}>Vote on comments on this proposal:</Text>
              <Text>{unvotedComments.length > 25 ? "25+" : unvotedComments.length} remaining</Text>
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
          <Box
            sx={{
              fontSize: "0.9em",
              mb: "10px",
              color: "#9f9e9b",
              fontWeight: 500,
            }}
          >
            <Text>Add your comment to this proposal:</Text>
          </Box>
          <PrefilledComments zid_metadata={zid_metadata} />
        </Box>
      )}

      {unvotedComments.length === 0 && votedComments.length !== 0 && (
        <React.Fragment>
          <Box sx={{ ...surveyBox }}>
            <Box
              sx={{
                fontSize: "0.9em",
                mb: "10px",
                color: "#9f9e9b",
                fontWeight: 500,
                display: "flex",
              }}
            >
              <Text sx={{ flex: 1 }}>
                You’ve voted on all {votedComments.length} comments, but you can still add more:
              </Text>
              <Text></Text>
            </Box>
            <PrefilledComments zid_metadata={zid_metadata} />
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
