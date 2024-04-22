import React, { useCallback, useState } from "react"
import { Box, Text } from "theme-ui";
import useSWR from "swr";

const fetcher = url => fetch(url).then(r => r.json())


export const SentimentCheckComments: React.FC<{ user; zid_metadata }> = ({
  user,
  zid_metadata,
}) => {
  const { data } = useSWR(
    `/api/v3/conversation/sentiment_comments?conversation_id=${zid_metadata.conversation_id}`,
    fetcher
  )
  const [comment, setComment] = useState("")

  const submitComment = useCallback((comment: string) => {
    fetch(`/api/v3/conversation/sentiment_comments?conversation_id=${zid_metadata.conversation_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comment,
      }),
    }).then(() => {
      setComment("")
    })
  }, [zid_metadata])

  return (
    <Box>
      <Text>Comments</Text><br/>
      list comments here<br/>

      submit comment form here <br/>
      <input
        type="text"
        placeholder="Comment"
        onChange={(e) => setComment(e.target.value)}
        value={comment}
      />
      <button onClick={() => submitComment(comment)}>Submit</button>
    </Box>
  )
}
