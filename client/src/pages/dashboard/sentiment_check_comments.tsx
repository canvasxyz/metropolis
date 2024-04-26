import React, { useCallback, useState, useRef } from "react"
import { Box, Flex, Image, Link, Text, Button, Textarea } from "theme-ui"
import useSWR from "swr"
import { formatTimeAgo } from "../../util/misc"

const MAX_COMMENT_LENGTH = 150

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

  const commentTextareaRef = useRef()
  const [remainingCharCount, setRemainingCharCount] = useState(MAX_COMMENT_LENGTH)

  const submitComment = useCallback(
    (comment: string) => {
      return fetch(`/api/v3/conversation/sentiment_comments?conversation_id=${conversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment,
        }),
      }).then((response) => {
        if (response.status === 500) {
          return
        }
        mutate()
        setComment("")
        if (commentTextareaRef) {
          ;(commentTextareaRef.current as any).value = ""
        }
      })
    },
    [conversationId],
  )

  const deleteComment = useCallback((commentId: number) => {
    return fetch(`/api/v3/conversation/sentiment_comments?comment_id=${commentId}`, {
      method: "DELETE",
    }).then(() => {
      mutate()
    })
  }, [])

  return (
    <Flex sx={{ flexDirection: "column", gap: "8px" }}>
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
                  href={comment.is_deleted ? "#" : `https://github.com/${comment.github_username}`}
                  target={comment.is_deleted ? undefined : "_blank"}
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
              <Box sx={{ mt: "5px", "white-space": "pre-line" }}>{comment.comment}</Box>
            </Flex>
          ))}
        </Flex>
      ) : null}

      <Box sx={{ px: "8px", pb: "8px" }}>
        <Textarea
          disabled={!user}
          sx={{ borderColor: "lightGray" }}
          placeholder={user ? "Add a comment..." : "Must be signed in to comment"}
          onChange={(e) => {
            setComment(e.target.value)
            setRemainingCharCount(MAX_COMMENT_LENGTH - e.target.value.length)
          }}
          rows={2}
          ref={commentTextareaRef}
        />
        <Flex>
          <Box sx={{ flex: 1 }}>
            <Button
              variant={user ? "buttons.primary" : "buttons.disabled"}
              onClick={() => {
                if (!comment || comment.trim() === "") return
                submitComment(comment)
              }}
            >
              Submit
            </Button>
          </Box>
          <Box sx={{ mt: "8px", color: remainingCharCount >= 0 ? "mediumGray" : "mediumRed" }}>
            {remainingCharCount}
          </Box>
        </Flex>
      </Box>
    </Flex>
  )
}
