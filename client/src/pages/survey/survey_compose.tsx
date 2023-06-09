import React, { useRef, useEffect, useState } from "react"
import { Box, Heading, Button, Text, Textarea, Flex, jsx } from "theme-ui"

import type { Comment } from "../../util/types"
import { DropdownButton } from "../../components/dropdown"
import SurveyCard from "./survey_card"
import api from "../../util/api"

const SurveyCompose: React.FC<{ zid_metadata; votedComments; setVotedComments }> = ({
  zid_metadata,
  votedComments,
  setVotedComments,
}) => {
  const inputRef = useRef<HTMLInputElement>()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const submitComment = (txt: string, vote: number) => {
    const params = {
      pid: "mypid",
      conversation_id: zid_metadata.conversation_id,
      vote,
      txt: txt.replace(/\n/g, " "), // replace newlines with whitespace
      agid: 1,
    }

    return api
      .post("api/v3/comments", params)
      .fail((xhr: XMLHttpRequest, evt: string, err: string) => alert(err))
      .then(({ tid, currentPid }: { tid: string; currentPid: string }) => {
        const comment: Comment = {
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
        setVotedComments([...votedComments, comment])
      })
  }

  return (
    <Box
      sx={{
        mb: [3, null, 4],
        margin: "0 auto",
        border: "1px solid",
        borderColor: "lighterGray",
        px: "40px",
        py: "36px",
        borderRadius: "8px",
      }}
    >
      <form onSubmit={(e) => e.preventDefault()}>
        <Textarea
          sx={{
            fontFamily: "body",
            fontSize: [2],
            width: "100%",
            borderRadius: "3px",
            padding: [2],
            border: "1px solid",
            borderColor: "lightGray",
            mb: [3],
          }}
          ref={inputRef}
          placeholder="Write a new comment..."
        />
        <Flex>
          <Box>
            <DropdownButton
              options={[
                {
                  name: "Add new comment",
                  onClick: () => {
                    submitComment(inputRef.current.value, 1).then(
                      () => (inputRef.current.value = "")
                    )
                  },
                  default: true,
                },
                {
                  name: "Add new comment (disagree)",
                  onClick: () => {
                    submitComment(inputRef.current.value, -1).then(
                      () => (inputRef.current.value = "")
                    )
                  },
                },
              ]}
            />
          </Box>
        </Flex>
      </form>
    </Box>
  )
}

export default SurveyCompose
