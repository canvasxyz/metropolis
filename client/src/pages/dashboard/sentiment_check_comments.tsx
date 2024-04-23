import React, { useCallback, useState } from "react"
import { Box, Flex, Image, Link, Text, Button, Textarea } from "theme-ui"
import useSWR from "swr"
import { formatTimeAgo } from "../../util/misc"

const fetcher = (url) => fetch(url).then((r) => r.json())

export const SentimentCheckComments: React.FC<{ user; conversationId: string }> = ({
  user,
  conversationId,
}) => {
  const { data, mutate } = useSWR(
    `/api/v3/conversation/sentiment_comments?conversation_id=${conversationId}`,
    fetcher,
  )
  const sentimentComments = data || []
  const [comment, setComment] = useState("")

  const submitComment = useCallback(
    (comment: string) => {
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
    },
    [conversationId],
  )

  const deleteComment = useCallback((commentId: number) => {
    fetch(`/api/v3/conversation/sentiment_comments?comment_id=${commentId}`, {
      method: "DELETE",
    }).then(() => {
      mutate()
    })
  }, [])

  return (
    <Flex sx={{ flexDirection: "column", gap: "8px" }}>
      <Text
        sx={{
          fontWeight: "bold",
        }}
      >
        Comments
      </Text>
      {sentimentComments.length > 0 ? (
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
                gap: "6px",
              }}
              key={comment.id}
            >
              <Flex
                sx={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Link
                  href={
                    comment.is_deleted
                      ? "javascript:"
                      : `https://github.com/${comment.github_username}`
                  }
                  target="_blank"
                >
                  {comment.is_deleted ? (
                    <Box
                      sx={{
                        width: "24px",
                        height: "24px",
                        borderRadius: 6,
                        marginRight: "9px",
                        background: "#ccc",
                      }}
                    ></Box>
                  ) : (
                    <Image
                      src={`https://github.com/${comment.github_username}.png`}
                      width="24"
                      height="24"
                      style={{
                        borderRadius: 6,
                        marginRight: "9px",
                        background: "#ccc",
                        marginTop: "2px",
                        marginBottom: "-5px",
                      }}
                    />
                  )}
                </Link>
                <Text sx={{ flexGrow: 1 }}>
                  <Text sx={{ fontWeight: 600, mr: "6px" }}>{comment.github_username}</Text>
                  <Text sx={{ color: "mediumGray" }}>
                    {formatTimeAgo(parseInt(comment.created))}
                  </Text>
                </Text>
                {comment.can_delete && (
                  <Text
                    variant="links.textGray"
                    sx={{ fontWeight: 400 }}
                    onClick={() => deleteComment(comment.id)}
                  >
                    Delete
                  </Text>
                )}
              </Flex>
              <Box sx={{ mt: "5px" }}>{comment.comment}</Box>
            </Flex>
          ))}
        </Flex>
      ) : (
        <>No comments yet</>
      )}

      <Box sx={{ px: "8px", pb: "8px" }}>
        <Textarea
          placeholder="Add a comment..."
          onChange={(e) => setComment(e.target.value)}
          rows={2}
        />
        <Button onClick={() => submitComment(comment)}>Submit</Button>
      </Box>
    </Flex>
  )
}
