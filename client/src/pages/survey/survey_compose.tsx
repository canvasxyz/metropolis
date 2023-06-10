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
  const importantRef = useRef<HTMLInputElement>()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const submitComment = (txt: string, vote: number) => {
    const finalTxt = txt.replace(/\n/g, " ").trim() // replace newlines with whitespace
    const params = {
      pid: "mypid",
      conversation_id: zid_metadata.conversation_id,
      vote,
      txt: finalTxt,
      agid: 1,
    }

    return api
      .post("api/v3/comments", params)
      .fail((xhr: XMLHttpRequest, evt: string, err: string) => {
        if (err.toString() === "Conflict") {
          setError("Comment already exists")
        } else if (finalTxt === "") {
          setError("Could not add empty comment")
        } else {
          setError(err.toString())
        }
      })
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
        rows={4}
        ref={inputRef}
        placeholder="Write a new comment..."
        autoFocus
      />
      <Box sx={{ mb: [3] }}>
        <DropdownButton
          sx={{ display: "inline-block" }}
          options={[
            {
              name: "Add new comment (agree)",
              onClick: () => {
                submitComment(inputRef.current.value, 1).then(() => {
                  inputRef.current.value = ""
                  importantRef.current.checked = false
                  setError("")
                  setSuccess(true)
                  setTimeout(() => setSuccess(false), 1500)
                })
              },
              default: true,
            },
            {
              name: "Add new comment (disagree)",
              onClick: () => {
                submitComment(inputRef.current.value, -1).then(() => {
                  inputRef.current.value = ""
                  importantRef.current.checked = false
                  setError("")
                  setSuccess(true)
                  setTimeout(() => setSuccess(false), 1500)
                })
              },
            },
          ]}
        />
      </Box>
      <Box sx={{ fontFamily: "monospace" }}>
        {success ? (
          <Text sx={{ mt: [2], color: "mediumGreen" }}>Comment added!</Text>
        ) : (
          <label>
            <input type="checkbox" ref={importantRef} onChange={() => false} />
            &nbsp;This option is important to me
          </label>
        )}
        {error && <Box sx={{ mt: [2], color: "mediumRed" }}>{error}</Box>}
      </Box>
    </form>
  )
}

export default SurveyCompose
