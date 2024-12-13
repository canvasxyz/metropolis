import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { TbExternalLink } from "react-icons/tb"
import { Box, Heading, Button, Text, Flex } from "@radix-ui/themes"

const PostSurvey = ({
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
    <Flex direction="column" gap="3">
      {postsurvey ? (
        <Flex
          p="5"
          direction="column"
          gap="3"
          style={{
            border: "1px solid",
            borderColor: "#e2ddd5",
            backgroundColor: "#faf9f6",
            borderRadius: "8px"
          }}>
          <Heading size="4">
            Nice work!
          </Heading>
          <Text className="react-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{postsurvey}</ReactMarkdown>
          </Text>
        </Flex>
      ) : (
        <Flex
          p="5"
          direction="column"
          gap="3"
          style={{
            border: "1px solid",
            borderColor: "#e2ddd5",
            backgroundColor: "#faf9f6",
            borderRadius: "8px"
          }}>
          <Heading size="4">
            You’re done for now!
          </Heading>
          <Text mb="2">
            Congratulations! You’ve voted on{" "}
            <strong>
              {votedComments.length - submittedComments.length} of{" "}
              {votedComments.length + unvotedComments.length - submittedComments.length}
            </strong>{" "}
            statements, and submitted <strong>{submittedComments.length}</strong> of your own.
          </Text>
          <Text mb="2">
            Come back to this page to vote on new statements as they’re written.
          </Text>
        </Flex>
      )}
      {postsurvey_redirect && (
        <Button
          style={{ width: "100%" }}
          onClick={() => window.open(postsurvey_redirect)}
        >
          Continue to next steps
          <TbExternalLink style={{ marginLeft: "5px", position: "relative", top: "2px" }} />
        </Button>
      )}

      <Button
        variant="outline"
        style={{ width: "100%" }}
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
export default PostSurvey
