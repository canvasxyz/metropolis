/** @jsx jsx */

import { useState, useRef, useEffect, useCallback } from "react"
import { Box, Button, Flex, Text, jsx } from "theme-ui"
import { TbExternalLink } from "react-icons/tb"
import { surveyBox } from "./index"
import { PolisSurveyCard } from "./polis_card"

// Debounce function
const debounce = (fn, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export const PolisSurveyCards = ({
  conversation_id,
  votedComments,
  unvotedComments,
  onVoted,
  goTo,
  postsurvey,
  postsurvey_redirect,
  voteDisabled,
}: {
  conversation_id
  votedComments
  unvotedComments
  onVoted
  goTo
  postsurvey,
  postsurvey_redirect,
  voteDisabled: boolean,
}) => {
  const [cardHeight, setCardHeight] = useState(240)
  const topCardRef = useRef<HTMLDivElement>(null)
  
  const updateCardHeight = useCallback(
    debounce(() => {
      if (topCardRef.current) {
        console.log(topCardRef.current.offsetHeight)
        setCardHeight(topCardRef.current.offsetHeight)
      }
    }, 50),
    []
  )
  
  // Update card height when the top card changes, or window resizes
  useEffect(() => {
    if (topCardRef.current && unvotedComments.length > 0) {
      const resizeObserver = new ResizeObserver(entries => {
        updateCardHeight()
      })
      
      resizeObserver.observe(topCardRef.current)
      
      // Add window resize handler
      window.addEventListener('resize', updateCardHeight)
      
      return () => {
        resizeObserver.disconnect()
        window.removeEventListener('resize', updateCardHeight)
      }
    }
  }, [unvotedComments, updateCardHeight])

  return (
    <Box mt="4" sx={{ position: "relative" }}>
      {unvotedComments.length > 0 && (
        <Box
          sx={{ height: `${cardHeight}px` }}
        >
          {unvotedComments.slice(0, 5).map((comment, index) => (
            <Box
              key={comment.tid}
              ref={index === 0 ? topCardRef : null}
              sx={{
                mb: "12px",
                transition: "0.2s ease-in-out",
                position: "absolute",
                top: 0,
                width: '100%',
                filter: index > 0 ? 'blur(3px)' : 'none',
                opacity: index > 0 ? 0.3 : 1,
                zIndex: 5 - index,
                pointerEvents: index > 0 ? 'none' : '',
              }}
            >
              <PolisSurveyCard
                comment={comment}
                conversationId={conversation_id}
                onVoted={onVoted}
                hasVoted={false}
                voteDisabled={voteDisabled}
              />
            </Box>
          ))}
        </Box>
      )}
      {unvotedComments.length === 0 && votedComments.length === 0 && (
        <Box sx={{ ...surveyBox, padding: "50px 32px", fontWeight: 500, fontSize: "0.94em" }}>
          No comments on this poll yet.
        </Box>
      )}
      {unvotedComments.length === 0 && votedComments.length !== 0 && (
        <Flex sx={{flexDirection: "column", gap: 3}}>
          <Box
            sx={{
              ...surveyBox,
              bg: "bgWhite",
              padding: "50px 32px",
              fontWeight: 500,
              fontSize: "0.94em",
            }}
          >
            You've voted on all the comments so far.
            <br />
            Come back later to see more comments, or add some of your own.
          </Box>
          {(postsurvey || postsurvey_redirect) && (
            <Button
              variant="primary"
              onClick={(e) => {
                e.stopPropagation()
                postsurvey
                  ? goTo("postsurvey")
                  : window.open(postsurvey_redirect)
              }}
              sx={{ width: "100%", mb: [3] }}
            >
              Go to next steps
              {!postsurvey && (
                <TbExternalLink style={{ marginLeft: "5px", position: "relative", top: "2px" }} />
              )}
            </Button>
          )}
        </Flex>
      )}
    </Box>
  )
}