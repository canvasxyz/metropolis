import React, { useEffect, useState, useRef } from 'react'
import { connect } from 'react-redux'
import { Box, Heading, Button, Text, Input } from 'theme-ui'

import api from '../../util/api';

// const fetchUser = () => {
//   return api.get('/api/v3/users', { errIfNoAuth: true })
// }

// serverClient == js/stores/polis

// votesByMe

// pollForComments: loops, at interval
//   -> getNextAndShow
//      -> serverclient.getNextComment(params)

// serverClient.mod
// serverClient.star => serverClient.star and serverClient.agree
// serverClient.trash

// wipVote to handle first vote
// showEmpty to handle no-comments situation

// type Comment = {
//   txt: string
//   tid: number
//   created: string
//   tweet_id: string | null
//   quote_src_url: string | null
//   is_seed: boolean
//   is_meta: boolean
//   lang: null
//   pid: number
// }

function Survey({ match: { params }}) {
  const { conversation_id } = params

  const inputRef = useRef()
  const [unvotedComments, setUnvotedComments] = useState([])
  const [allComments, setAllComments] = useState([])

  useEffect(() => {
    api.get("api/v3/comments", {
      lastServerToken: (new Date(0)).getTime(),
      not_voted_by_pid: "mypid",
      conversation_id,
    }).then((comments) => {
      setUnvotedComments(comments)
    })

    api.get("api/v3/comments", {
      lastServerToken: (new Date(0)).getTime(),
      conversation_id,
    }).then((comments) => {
      setAllComments(comments)
    })
  }, [])

  const submitComment = (txt) => {
    if (/^\s*$/.exec(txt)) throw new Error("empty comment")
    if (typeof txt !== "string" || txt.length > 997) throw new Error("comment too long")

    const params = {
      pid: "mypid",
      conversation_id,
      // TODO: don't do this! give an option to agree/disagree (since math assumes every comment has at least one vote)
      vote: 1,
      txt: txt.replace(/\n/g, " "), // replace newlines with whitespace
      agid: 1,
    };

    api.post("api/v3/comments", params).then(({ tid, currentPid }) => {
      // TODO: create new comment with `tid`
      // TODO: create new vote

      // function getNextComment(conversationId, currentCommentTid) {
      //   return api.get("api/v3/nextComment", {
      //     not_voted_by_pid: "mypid",
      //     limit: 1,
      //     include_social: true,
      //     conversation_id: conversationId,
      //     without: currentCommentTid ? [currentCommentTid] : []
      //   });
      // }
    })
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
        <Input ref={inputRef} placeholder="hi"/>
        <Button onClick={() => {
          submitComment(inputRef.current.value)
        }}>
          Add new card
        </Button>
      </Box>
      <Text sx={{ mb: 3 }}>{allComments.length} comments</Text>
      <Text sx={{ mb: 3 }}>{unvotedComments.length} comments remaining to vote</Text>
      {allComments.map((comment) =>
        <SurveyComment comment={comment} conversationId={conversation_id} />
      )}
    </Box>);
}

const SurveyComment = ({ comment, conversationId }) => {
  const { tid: commentId, txt, created, pid } = comment;

  // returns promise {nextComment: {tid:...}} or {} if no further comments
  const agree = (commentId, starred = undefined, weight = 0) => {
    return api.post("api/v3/votes", {
      pid: "mypid",
      conversation_id: conversationId,
      agid: 1,
      weight,
      vote: -1,
      tid: commentId
      // starred: boolean
    })
  }
  const disagree = (commentId, starred = undefined, weight = 0) => {
    return api.post("api/v3/votes", {
      pid: "mypid",
      conversation_id: conversationId,
      agid: 1,
      weight,
      vote: 1,
      tid: commentId
      // starred: boolean
    });
  }
  const skip = (tid, starred = undefined, weight = 0) => {
    return api.post("api/v3/votes", {
      pid: "mypid",
      conversation_id: conversationId,
      agid: 1,
      weight,
      vote: 0,
      tid: tid
      // starred: boolean
    });
  }

  return (
    <Box sx={{
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

// // find representatives?
// function getXids(conversationId) {
//   return api.get("api/v3/xids", {
//     conversation_id: conversationId
//   });
// }
//
// // import tweets?
// function importTweet(conversationId, twitterTweetId, vote) {
//   return api.post("api/v3/comments", {
//     conversation_id: conversationId,
//     twitter_tweet_id: twitterTweetId,
//     vote: vote,
//   });
// }
//
// // invite?
// function invite(conversationId, xids) {
//   return api.post("api/v3/users/invite", {
//     single_use_tokens: true,
//     conversation_id: conversationId,
//     xids: xids
//   });
// }
//
// // trash comments?
// function trash(conversationId, tid) {
//   return api.post("api/v3/trashes", {
//     tid: tid,
//     trashed: 1,
//     conversation_id: conversationId
//   });
// }

export default Survey;
