/** @jsx jsx */

import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { TbExternalLink } from "react-icons/tb"
import { Box, Heading, Button, Text, Textarea, Flex, jsx } from "theme-ui"

import { surveyBox, surveyHeadingMini } from "./index"
import SurveyCard from "./survey_card"
import SurveyCompose from "./survey_compose"
import { PrefilledComments } from "./survey_cards"

const PostSurvey = ({
  user,
  conversation_id,
  submittedComments,
  votedComments,
  unvotedComments,
  zid_metadata,
  goTo,
  setVotingAfterPostSurvey,
}) => {
  return (
    <React.Fragment>
      {zid_metadata.postsurvey ? (
        <Box sx={{ ...surveyBox, pt: [5], pb: [5] }}>
          <Heading as="h3" sx={{ ...surveyHeadingMini, fontSize: "22px" }}>
            Nice work!
          </Heading>
          <Text className="react-markdown">
            <ReactMarkdown children={zid_metadata.postsurvey} remarkPlugins={[remarkGfm]} />
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
      {zid_metadata.postsurvey_redirect && (
        <Button
          variant="primary"
          sx={{ width: "100%", mt: [3] }}
          onClick={() => window.open(zid_metadata.postsurvey_redirect)}
        >
          Continue to next steps
          <TbExternalLink style={{ marginLeft: "5px", position: "relative", top: "2px" }} />
        </Button>
      )}

      <Button
        variant="outline"
        sx={{ width: "100%", mt: [3] }}
        onClick={() => {
          setVotingAfterPostSurvey(true)
          goTo("voting")
        }}
      >
        Go back to voting
      </Button>
    </React.Fragment>
  )
}
export default PostSurvey
