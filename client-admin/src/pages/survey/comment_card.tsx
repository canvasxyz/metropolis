import React, { useEffect, useState, useRef } from 'react'
import { connect } from 'react-redux'
import { Box, Heading, Button, Text, Input } from 'theme-ui'

import api from '../../util/api';
import type { Comment } from "../../util/types"

type CommentCardProps = {
    comment: Comment,
    conversationId: string,
    onVoted: Function,
    hasVoted: boolean,
}

const CommentCard = ({ comment, conversationId, onVoted, hasVoted }: CommentCardProps) => {
  const { tid: commentId, txt, created, pid } = comment;

  const [voting, setVoting] = useState(false)

  // returns promise {nextComment: {tid:...}} or {} if no further comments
  const agree = (commentId: string, starred: boolean = undefined, weight = 0) => {
    setVoting(true)
    api.post("api/v3/votes", {
      pid: "mypid",
      conversation_id: conversationId,
      agid: 1,
      weight,
      vote: -1,
      tid: commentId
      // starred: boolean
    })
      .then(() => onVoted(commentId))
      .finally(() => setVoting(false))
  }
  const disagree = (commentId: string, starred: boolean = undefined, weight = 0) => {
    setVoting(true)
    api.post("api/v3/votes", {
      pid: "mypid",
      conversation_id: conversationId,
      agid: 1,
      weight,
      vote: 1,
      tid: commentId
      // starred: boolean
    })
      .then(() => onVoted(commentId))
      .finally(() => setVoting(false))
  }
  const skip = (tid: string, starred: boolean = undefined, weight = 0) => {
    setVoting(true)
    api.post("api/v3/votes", {
      pid: "mypid",
      conversation_id: conversationId,
      agid: 1,
      weight,
      vote: 0,
      tid: tid
      // starred: boolean
    })
      .then(() => onVoted(commentId))
      .finally(() => setVoting(false))
  }

  return (
    <Box sx={{
      opacity: hasVoted ? 0.5 : 1,
      pointerEvents: hasVoted ? 'none' : 'initial',
      display: "inline-block",
      border: "1px solid #ddd",
      width: 400,
      p: [20],
      mb: [3, null, 4]
    }}>
      <Text sx={{ mb: 4 }}>
        {txt}
      </Text>
      <Button sx={{ mr: 2 }} onClick={agree.bind(null, commentId)}>
        Agree
      </Button>
      <Button sx={{ mr: 2 }} onClick={disagree.bind(null, commentId)}>
        Disagree
      </Button>
      <Button sx={{ mr: 2 }} onClick={skip.bind(null, commentId)}>
        Skip
      </Button>
    </Box>
  );
}

export default CommentCard;

// // find representatives?
// function getXids(conversationId) {
//   return api.get("api/v3/xids", {
//     conversation_id: conversationId
//   });
// }

// // import tweets?
// function importTweet(conversationId, twitterTweetId, vote) {
//   return api.post("api/v3/comments", {
//     conversation_id: conversationId,
//     twitter_tweet_id: twitterTweetId,
//     vote: vote,
//   });
// }

// // invite?
// function invite(conversationId, xids) {
//   return api.post("api/v3/users/invite", {
//     single_use_tokens: true,
//     conversation_id: conversationId,
//     xids: xids
//   });
// }

// // trash comments?
// function trash(conversationId, tid) {
//   return api.post("api/v3/trashes", {
//     tid: tid,
//     trashed: 1,
//     conversation_id: conversationId
//   });
// }

// // poll for new comments, since others might be creating comments?
// function getNextComment(conversationId, currentCommentTid) {
//   return api.get("api/v3/nextComment", {
//     not_voted_by_pid: "mypid",
//     limit: 1,
//     include_social: true,
//     conversation_id: conversationId,
//     without: currentCommentTid ? [currentCommentTid] : []
//   });
// }
