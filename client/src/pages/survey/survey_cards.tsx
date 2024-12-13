import React, { useState } from "react"
import { Box, Button, Flex, Text } from "@radix-ui/themes"
import { TbExternalLink } from "react-icons/tb"
import { surveyBox } from "./index"
import SurveyCard from "./survey_card"

const SurveyCards = ({
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
  // className={collapsed ? "react-markdown css-fade" : "react-markdown"}
  const [collapsed, setCollapsed] = useState(true)

  return (
    <Box position="relative">
      {unvotedComments.length > 0 && (
        <Box
          className={collapsed && unvotedComments.length > 2 ? "css-fade-more" : ""}
          maxHeight={collapsed ? "420px" : "none"}
          overflow={collapsed ? "hidden" : "visible"}
        >
          {unvotedComments.map((comment, index) => (
            <Box
              key={comment.tid}
              mb="12px"
              style={{
                transition: "0.2s ease-in-out",
              }}
            >
              <SurveyCard
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
      {unvotedComments.length > 2 && (
        <Box mt="16px" mb="10px" width="100%">
          <Text
            as="div"
            align="center"
            weight="bold"
            onClick={(e) => {
              e.stopPropagation()
              setCollapsed(!collapsed)
            }}
          >
            {collapsed
              ? `Show more comments (${unvotedComments.length} total)`
              : "Show fewer comments"}
          </Text>
        </Box>
      )}
      {unvotedComments.length === 0 && votedComments.length === 0 && (
        <Box
          p="50px 32px"
          style={{
            border: "1px solid",
            backgroundColor: "#faf9f6",
            borderRadius: "8px",
          }}
        >
          <Text>
            No comments on this poll yet.
          </Text>
        </Box>
      )}
      {unvotedComments.length === 0 && votedComments.length !== 0 && (
        <Flex direction="column" gap="3">
          <Box
            p="50px 32px"
            style={{
              border: "1px solid",
              borderColor: "#e2ddd5",
              borderRadius: "8px",
              backgroundColor: "white",
            }}
          >
            <Text
              style={{
                fontWeight: 500,
                fontSize: "0.94em"
              }
            }>
              You’ve voted on all {votedComments.length} responses so far.
              <br />
              Come back later for more to vote on, or add your own.
            </Text>
          </Box>
          {(postsurvey || postsurvey_redirect) && (
            <Button
              size="3"
              onClick={(e) => {
                e.stopPropagation()
                postsurvey
                  ? goTo("postsurvey")
                  : window.open(postsurvey_redirect)
              }}
              style={{ width: "100%"}}
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

export default SurveyCards
