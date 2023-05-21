/** @jsx jsx */

import React, { useEffect, useState, useRef } from "react"
import { connect, useDispatch, useSelector } from "react-redux"
import { Box, Heading, Button, Text, Textarea, Flex, jsx } from "theme-ui"

import api from "../util/api"
import SurveyCard from "./survey_card"
import type { RootState, Comment, Conversation } from "../util/types"
import { populateZidMetadataStore, resetMetadataStore } from "../actions"

// TODO: enforce comment too long on backend

const Divider = () => {
  return (
    <Box sx={{ width: "100%", py: [5] }}>
      <hr
        sx={{
          maxWidth: "100px",
          border: "none",
          borderBottom: "1px solid",
          borderBottomColor: "secondary",
        }}
      />
    </Box>
  )
}

const SurveyHeading = ({ zid_metadata }) => {
  return (
    <Box
      sx={{
        mb: [3, null, 4],
      }}
    >
      <Heading
        as="h3"
        sx={{
          fontSize: [3, null, 4],
          lineHeight: "body",
          mb: [2],
        }}
      >
        {!zid_metadata.topic ? (
          <Text sx={{ color: "lightGray" }}>Untitled Conversation</Text>
        ) : (
          zid_metadata.topic
        )}
      </Heading>
      {zid_metadata?.description && <Box sx={{ mb: [3, null, 4] }}>{zid_metadata.description}</Box>}
    </Box>
  )
}

const SurveyCompose: React.FC<{ zid_metadata; votedComments; setVotedComments }> = ({
  zid_metadata,
  votedComments,
  setVotedComments,
}) => {
  const inputRef = useRef<HTMLInputElement>()
  const [isAgree, setIsAgree] = useState<boolean>(true)
  const [isDisagree, setIsDisagree] = useState<boolean>()

  const submitComment = (txt: string) => {
    const params = {
      pid: "mypid",
      conversation_id: zid_metadata.conversation_id,
      vote: 0,
      txt: txt.replace(/\n/g, " "), // replace newlines with whitespace
      agid: 1,
    }

    return api
      .post("api/v3/comments", params)
      .fail((xhr: XMLHttpRequest, evt: string, err: string) => alert(err))
      .then(({ tid, currentPid }: { tid: string; currentPid: string }) => {
        const comment: Comment = {
          txt: params.txt,
          tid,
          created: null,
          tweet_id: null,
          quote_src_url: null,
          is_seed: false,
          is_meta: false,
          lang: null,
          pid: currentPid,
        }
        setVotedComments([comment, ...votedComments])
      })
  }

  return (
    <Box
      sx={{
        mb: [3, null, 4],
        margin: "0 auto",
        border: "1px solid",
        borderColor: "lighterGray",
        px: "40px",
        py: "36px",
        borderRadius: "8px",
      }}
    >
      <form onSubmit={(e) => e.preventDefault()}>
        <Textarea
          sx={{
            fontFamily: "body",
            fontSize: [2],
            width: "100%",
            borderRadius: 2,
            padding: [2],
            border: "1px solid",
            borderColor: "mediumGray",
            mb: [3],
          }}
          ref={inputRef}
          placeholder="Write a new card here..."
        />
        <Flex>
          <Box sx={{ flex: 1 }}>
            <Button
              onClick={() => {
                submitComment(inputRef.current.value).then(() => (inputRef.current.value = ""))
              }}
            >
              Add new comment
            </Button>
          </Box>
          <Box sx={{ mt: 2 }}>
            <label>
              <input
                type="checkbox"
                data-test-id="new-comment-agree"
                checked={isAgree}
                onChange={() => {
                  setIsAgree(true)
                  setIsDisagree(false)
                }}
                sx={{ ml: 3, mr: 2 }}
              />
              Agree
            </label>
          </Box>
          <Box sx={{ mt: 2 }}>
            <label>
              <input
                type="checkbox"
                data-test-id="new-comment-disagree"
                checked={isDisagree}
                onChange={() => {
                  setIsAgree(false)
                  setIsDisagree(true)
                }}
                sx={{ ml: 3, mr: 2 }}
              />
              Disagree
            </label>
          </Box>
        </Flex>
      </form>
    </Box>
  )
}

const SurveyCards = ({ conversation_id, votedComments, unvotedComments, onVoted }) => {
  return (
    <Box>
      <Flex>
        <Text sx={{ color: "lightGray", margin: "20px auto" }}>
          You’ve voted on {votedComments.length}/{votedComments.length + unvotedComments.length}{" "}
          comments
        </Text>
      </Flex>
      <Box sx={{ pb: "180px" }}>
        {unvotedComments.map((comment, i) => (
          <SurveyCard
            key={comment.tid}
            comment={comment}
            conversationId={conversation_id}
            onVoted={onVoted}
            hasVoted={false}
            stacked={true}
          />
        ))}
        {unvotedComments.length === 0 && (
          <Box
            sx={{
              position: "relative",
              border: "1px solid",
              borderColor: "lighterGray",
              borderRadius: "8px",
              bg: "background",
              boxShadow: "1px 1px 4px rgba(0,0,0,0.04)",
              width: "100%",
              height: "180px",
              px: "40px",
              py: "36px",
              textAlign: "center",
              mb: "-120px",
            }}
          >
            <p>It looks like you've voted on everything.</p>
            <p>Maybe try writing some cards of your own?</p>
          </Box>
        )}
      </Box>
      <Flex>
        <Text sx={{ color: "lightGray", margin: "20px auto" }}>Already voted</Text>
      </Flex>
      <Box sx={{ pb: "180px" }}>
        {votedComments.map((comment, i) => (
          <SurveyCard
            key={comment.tid}
            comment={comment}
            conversationId={conversation_id}
            onVoted={onVoted}
            hasVoted={true}
            stacked={true}
          />
        ))}
      </Box>
    </Box>
  )
}

const Survey: React.FC<{ match: { params: { conversation_id: string } } }> = ({
  match: {
    params: { conversation_id },
  },
}) => {
  const dispatch = useDispatch()
  const [unvotedComments, setUnvotedComments] = useState([])
  const [votedComments, setVotedComments] = useState([])
  const [conversation, setConversation] = useState<Conversation>()

  const { zid_metadata } = useSelector((state: RootState) => state.zid_metadata)
  useEffect(() => {
    dispatch(populateZidMetadataStore(conversation_id))
    return () => {
      dispatch(resetMetadataStore())
    }
  }, [conversation_id])

  useEffect(() => {
    Promise.all([
      api.get("api/v3/comments", {
        lastServerToken: new Date(0).getTime(),
        not_voted_by_pid: "mypid",
        conversation_id,
      }),
      api.get("api/v3/comments", {
        lastServerToken: new Date(0).getTime(),
        conversation_id,
      }),
    ]).then(([unvotedComments, allComments]) => {
      const unvotedCommentIds = unvotedComments.map((c: Comment) => c.tid)
      setUnvotedComments(unvotedComments)
      setVotedComments(allComments.filter((c: Comment) => unvotedCommentIds.indexOf(c.tid) === -1))
    })
  }, [])

  const onVoted = (commentId: string) => {
    setUnvotedComments(unvotedComments.filter((c) => c.tid !== commentId))
  }

  return (
    <Box>
      <SurveyHeading zid_metadata={zid_metadata} />
      <SurveyCards
        votedComments={votedComments}
        unvotedComments={unvotedComments}
        onVoted={onVoted}
        conversation_id={conversation_id}
      />
      <Divider />
      <SurveyCompose
        zid_metadata={zid_metadata}
        votedComments={votedComments}
        setVotedComments={setVotedComments}
      />
      <Divider />
    </Box>
  )
}

export default connect((state: RootState) => state.zid_metadata)(Survey)
