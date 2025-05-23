/** @jsx jsx */

import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { TbExternalLink } from "react-icons/tb"
import { Box, Heading, Button, Text, jsx, Flex } from "theme-ui"

import { surveyBox, surveyHeadingMini } from "./index"

export const PolisPostSurvey = ({
  submittedComments,
  votedComments,
  unvotedComments,
  goTo,
  setVotingAfterPostSurvey,
  postsurvey,
  postsurvey_redirect,
}: {
  submittedComments
  votedComments
  unvotedComments
  goTo
  setVotingAfterPostSurvey
  postsurvey: string
  postsurvey_redirect: string
}) => {
  return (
    <Flex sx={{flexDirection: "column", gap: 3}}>
      {postsurvey ? (
        <Box sx={{ ...surveyBox, pt: [5], pb: [5] }}>
          <Heading as="h3" sx={{ ...surveyHeadingMini, fontSize: "22px" }}>
            Nice work!
          </Heading>
          <Text className="react-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{postsurvey}</ReactMarkdown>
          </Text>
        </Box>
      ) : (
        <Box sx={{ ...surveyBox, pt: [5] }}>
          <Heading as="h3" sx={{ ...surveyHeadingMini, fontSize: "22px" }}>
            You’re done for now!
          </Heading>
          <Text sx={{ mb: [2] }}>
            Congratulations! You’ve voted on{" "}
            <strong>
              {votedComments.length - submittedComments.length} of{" "}
              {votedComments.length + unvotedComments.length - submittedComments.length}
            </strong>{" "}
            statements, and submitted <strong>{submittedComments.length}</strong> of your own.
          </Text>
          <Text sx={{ mb: [2] }}>
            Come back to this page to vote on new statements as they’re written.
          </Text>
        </Box>
      )}
      {postsurvey_redirect && (
        <Button
          variant="primary"
          sx={{ width: "100%" }}
          onClick={() => window.open(postsurvey_redirect)}
        >
          Continue to next steps
          <TbExternalLink style={{ marginLeft: "5px", position: "relative", top: "2px" }} />
        </Button>
      )}

      <Button
        variant="outline"
        sx={{ width: "100%" }}
        onClick={(e) => {
          e.stopPropagation()
          setVotingAfterPostSurvey(true)
          goTo("voting")
        }}
      >
        Go back to voting
      </Button>
    </Flex>
  )
}
