import React, { useCallback, useState } from "react"
import { Box, Flex, Image, Link, Text } from "theme-ui";
import useSWR from "swr";
import { formatTimeAgo } from "../../util/misc";

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
    <Flex sx={{flexDirection:"column", gap: "8px"}}>
      <Text
        sx={{
          fontWeight: "bold",
        }}
      >
        Comments
      </Text>
      {
        sentimentComments.length > 0 ?
          <Flex
            sx={{
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {sentimentComments.map((comment) => (
              <Flex
                sx={{
                  flexDirection: "column",
                  padding: "8px",
                  gap: "6px"
                }}
                key={comment.id}
              >
                <Flex
                  sx={{
                    flexDirection: "row",
                    alignItems: "center"
                  }}
                >
                  <Link href={`https://github.com/${comment.github_username}`} target="_blank">
                    <Image
                      src={`https://github.com/${comment.github_username}.png`}
                      width="34"
                      height="34"
                      style={{
                        borderRadius: 6,
                        marginRight: "8px",
                        background: "#ccc",
                        marginTop: "2px",
                      }}
                    />
                  </Link>
                  <Text>{comment.github_username} - {new Date(parseInt(comment.created)).toLocaleString()}</Text>
                </Flex>
                <Box>{comment.comment}</Box>
              </Flex>
            ))}
          </Flex>
        :
          <>
            No comments yet
          </>
      }

      <input
        type="text"
        placeholder="Comment"
        onChange={(e) => setComment(e.target.value)}
        value={comment}
      />
      <button onClick={() => submitComment(comment)}>Submit</button>
    </Flex>
  )
}
