/** @jsx jsx */

import React, { useEffect, useState, useRef } from "react"
import { connect, useDispatch, useSelector } from "react-redux"
import { Box, Heading, Button, Text, Textarea, Flex, jsx } from "theme-ui"

import api from "../../util/api"
import type { RootState, Comment, Conversation } from "../../util/types"
import { populateZidMetadataStore, resetMetadataStore } from "../../actions"

import SurveyHeading from "./survey_heading"
import SurveyCompose from "./survey_compose"
import SurveyCards from "./survey_cards"

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
    const comment = unvotedComments.find((c) => c.tid === commentId)
    setUnvotedComments(unvotedComments.filter((c) => c.tid !== commentId))
    if (!comment) return
    setVotedComments([...votedComments, comment])
  }

  return (
    <Box>
      <SurveyHeading zid_metadata={zid_metadata} />
      <Divider />
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
