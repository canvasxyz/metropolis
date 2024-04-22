import React, { useCallback, useState } from "react"
import { Box, Text } from "theme-ui";
import useSWR from "swr";

const fetcher = url => fetch(url).then(r => r.json())


export const SentimentCheckComments: React.FC<{ user; conversationId: string }> = ({
  user,
  conversationId,
}) => {
  const { data, mutate } = useSWR(
    `/api/v3/conversation/sentiment_comments?conversation_id=${conversationId}`,
    fetcher
  )
  const sentimentComments = data || []
  const [comment, setComment] = useState("")

  const submitComment = useCallback((comment: string) => {
    fetch(`/api/v3/conversation/sentiment_comments?conversation_id=${conversationId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comment,
      }),
    }).then(() => {
      mutate()
      setComment("")
    })
  }, [conversationId, user])

  return (
    <Box>
      <Text>Comments</Text><br/>
      {sentimentComments.length > 0 ? <ul>
        {sentimentComments.map((comment) => (
          <li key={comment.id}>
            {comment.comment} by {comment.uid} on {comment.created}
          </li>
        ))}
      </ul> : <>No comments yet</>}

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
