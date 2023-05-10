import React, { useEffect, useState, useRef } from 'react'
import { connect } from 'react-redux'
import { Box, Heading, Button, Text, Input, Form } from 'theme-ui'

import api from '../../util/api';
import CommentCard from './comment_card';

// TODO: enforce comment too long on backend

function Survey({ match: { params }}) {
  const { conversation_id } = params

  const inputRef = useRef()
  const [unvotedComments, setUnvotedComments] = useState([])
  const [votedComments, setVotedComments] = useState([])

  useEffect(() => {
    Promise.all([
      api.get("api/v3/comments", {
        lastServerToken: (new Date(0)).getTime(),
        not_voted_by_pid: "mypid",
        conversation_id,
      }),
      api.get("api/v3/comments", {
        lastServerToken: (new Date(0)).getTime(),
        conversation_id,
      })
    ]).then(([unvotedComments, allComments]) => {
      const unvotedCommentIds = unvotedComments.map((c) => c.tid)
      setUnvotedComments(unvotedComments)
      setVotedComments(allComments.filter((c) => unvotedCommentIds.indexOf(c.tid) === -1))
    })
  }, [])

  const submitComment = (txt) => {
    const params = {
      pid: "mypid",
      conversation_id,
      vote: 0,
      txt: txt.replace(/\n/g, " "), // replace newlines with whitespace
      agid: 1,
    };

    return api.post("api/v3/comments", params)
      .fail((xhr, evt, err) => alert(err))
      .then(({ tid, currentPid }) => {
        const comment = {
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

  const onVoted = (commentId) => {
    setUnvotedComments(unvotedComments.filter((c) => c.tid !== commentId))
  }

  return (
    <Box>
      <Heading
        as="h3"
        sx={{
          fontSize: [3, null, 4],
          lineHeight: 'body',
          mb: [3, null, 4]
        }}>
        This Conversation
      </Heading>
      <Box sx={{ mb: [3, null, 4] }}>
        <form onSubmit={(e) => e.preventDefault()}>
          <Input ref={inputRef} placeholder="Write a new card here..."/>
          <Button onClick={() => {
            submitComment(inputRef.current.value)
              .then(() => inputRef.current.value = '')
          }}>Add new comment</Button>
          <Button sx={{ ml: 1 }}>Agree</Button>
          <Button sx={{ ml: 1 }}>Disagree</Button>
          <Button sx={{ ml: 1 }}>Skip</Button>
        </form>
      </Box>
      <Text sx={{ mb: 3 }}>{votedComments.length + unvotedComments.length} comments</Text>
      <Text sx={{ mb: 3 }}>{unvotedComments.length} comments remaining to vote</Text>
      {unvotedComments.map((comment) =>
        <CommentCard
          key={comment.tid}
          comment={comment}
          conversationId={conversation_id}
          onVoted={onVoted}
          hasVoted={false}
        />
      )}
      {votedComments.map((comment) =>
        <CommentCard
          key={comment.tid}
          comment={comment}
          conversationId={conversation_id}
          onVoted={onVoted}
          hasVoted={true}
        />
      )}
    </Box>);
}

export default Survey;
