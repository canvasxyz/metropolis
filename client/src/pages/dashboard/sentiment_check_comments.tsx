import React, { useCallback, useState, useRef } from "react"
import { Box, Flex, Link, Text, Button, TextArea } from "@radix-ui/themes"
import useSWR from "swr"
import { formatTimeAgo } from "../../util/misc"
import { useAppSelector } from "../../hooks"

const MAX_COMMENT_LENGTH = 150

const fetcher = (url) => fetch(url).then((r) => r.json())

export const SentimentCheckComments= ({
  conversationId,
}: { conversationId: string }) => {
  const { user } = useAppSelector((state) => state.user)

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
          (commentTextareaRef.current as any).value = ""
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
    <Flex direction="column" gap="8px">
      {sentimentComments.length > 0 ? (
        <Flex
          direction="column"
          gap="8px"
        >
          {sentimentComments.map((comment) => (
            <Flex
              direction="column"
              p="8px"
              gap="6px"
              key={comment.id}
            >
              <Flex
                direction="row"
                align="center"
              >
                <Link
                  href={comment.is_deleted ? "#" : `https://github.com/${comment.github_username}`}
                  target={comment.is_deleted ? undefined : "_blank"}
                >
                  {comment.is_deleted ? (
                    <Box
                      width="24px"
                      height="24px"
                      mr="9px"
                      style={{
                        borderRadius: 6,
                        marginRight: "9px",
                        backgroundColor: "#ccc",
                      }}
                    ></Box>
                  ) : (
                    <img
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
                <Box flexGrow="1">
                  <Text weight="bold" mr="6px">{comment.github_username}</Text>
                  <Text color="gray">
                    {formatTimeAgo(parseInt(comment.created))}
                  </Text>
                </Box>
                {comment.can_delete && (
                  <Link
                    href="#"
                    color="gray"
                    weight="light"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteComment(comment.id)
                    }}
                    style={{
                      cursor: "pointer"
                    }}
                  >
                    Delete
                  </Link>
                )}
              </Flex>
              <Box
                mt="5px"
                style={{ whiteSpace: "pre-line" }}
              >
                {comment.comment}
              </Box>
            </Flex>
          ))}
        </Flex>
      ) : null}

      <Flex direction="column" px="8px" pb="8px" gap="2">
        <TextArea
          disabled={!user}
          placeholder={user ? "Add a comment..." : "Must be signed in to comment"}
          onClick={(e) => {
            e.stopPropagation()
          }}
          onChange={(e) => {
            setComment(e.target.value)
            setRemainingCharCount(MAX_COMMENT_LENGTH - e.target.value.length)
          }}
          rows={2}
          ref={commentTextareaRef}
        />
        <Flex gap="2" align="center">
          <Button
            disabled={!user}
            onClick={(e) => {
              e.stopPropagation()
              if (!comment || comment.trim() === "") return
              submitComment(comment)
            }}
          >
            Submit
          </Button>
          <Text color={ remainingCharCount >= 0 ? "gray" : "red"}>
            {remainingCharCount}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
