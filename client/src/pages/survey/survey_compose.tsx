import React, { useRef, useState } from "react"
import { useLocalStorage } from "usehooks-ts"
import { TbMessageDots } from "react-icons/tb"
import { Link, Box, Heading, Button, Text } from "theme-ui"
import { toast } from "react-hot-toast"
import Modal from "react-modal"
import TextareaAutosize from "react-textarea-autosize"

import type { Comment } from "../../util/types"
import api from "../../util/api"
import { surveyHeadingMini } from "./index"

Modal.setAppElement("#root")

const SurveyComposeBox = ({
  user,
  unvotedComments,
  setUnvotedComments,
  submittedComments,
  setSubmittedComments,
  setState,
  onSubmit,
  conversation_id,
}: {
  user
  unvotedComments
  setUnvotedComments
  submittedComments
  setSubmittedComments
  setState
  onSubmit
  conversation_id: string
}) => {
  const inputRef = useRef<HTMLTextAreaElement>()
  const [cachedComment, setCachedComment] = useLocalStorage(
    "cachedComment-" + conversation_id,
    "",
  )
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submitComment = (txt: string, vote: number) => {
    setLoading(true)
    const finalTxt = txt.replace(/\n/g, " ").trim() // replace newlines with whitespace
    const params = {
      pid: "mypid",
      conversation_id: conversation_id,
      vote,
      txt: finalTxt,
      agid: 1,
    }

    return new Promise<void>((resolve, reject) =>
      api
        .post("api/v3/comments", params)
        .fail((xhr: XMLHttpRequest, evt: string, err: string) => {
          if (err.toString() === "Conflict") {
            setError("Someone has already submitted this response")
            toast.error("Already exists")
          } else if (finalTxt === "") {
            setError("Could not add empty response")
            toast.error("Invalid response")
          } else {
            setError(err.toString())
            toast.error(err.toString())
          }
          reject(err)
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
            github_username: user?.githubUsername ?? null,
          }
          setUnvotedComments([comment, ...unvotedComments])
          setSubmittedComments([comment, ...submittedComments])
          toast.success("Response added")

          resolve()
        }),
    )
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex" }}>
      <img
        src={user && `https://github.com/${user?.githubUsername}.png`}
        width="34"
        height="34"
        style={{
          borderRadius: 6,
          marginRight: "8px",
          background: "#ccc",
          marginTop: "2px",
        }}
      />
      <Box sx={{ flex: 1 }}>
        <TextareaAutosize
          style={{
            fontFamily: "inherit",
            fontSize: "1em",
            width: "100%",
            borderRadius: "3px",
            padding: "8px",
            border: "1px solid",
            borderColor: "lightGray",
            marginTop: "0px",
            background: loading ? "#eee" : undefined,
          }}
          disabled={!!loading}
          rows={2}
          minRows={2}
          maxRows={9}
          ref={inputRef}
          placeholder="Your response here"
          defaultValue={cachedComment}
          onBlur={() => {
            setCachedComment(inputRef.current.value)
          }}
          onClick={(e) => {
            e.stopPropagation()
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) {
              e.preventDefault()
              setCachedComment("")
              submitComment(inputRef.current.value, 1)
                .then(() => {
                  inputRef.current.value = ""
                  setError("")
                  onSubmit()
                })
                .finally(() => {
                  setLoading(false)
                  inputRef.current.focus()
                })
            } else {
              setCachedComment(inputRef.current.value)
            }
          }}
        />
        <Box sx={{ mb: [2] }}>
          <Button
            variant="primary"
            sx={{
              mt: [1],
              py: "4px",
              px: "10px",
              minWidth: "100px",
              fontSize: "0.98em",
              fontWeight: 500,
            }}
            onClick={(e) => {
              e.stopPropagation()
              submitComment(inputRef.current.value, 1)
                .then(() => {
                  inputRef.current.value = ""
                  setError("")
                  onSubmit()
                })
                .finally(() => {
                  setLoading(false)
                  inputRef.current.focus()
                })
            }}
          >
            Submit {!user && "anonymously"}
          </Button>
        </Box>
        <Box>{error && <Box sx={{ mt: [2], color: "mediumRed" }}>{error}</Box>}</Box>
      </Box>
    </form>
  )
}

const SurveyCompose = ({
  user,
  votedComments,
  unvotedComments,
  setUnvotedComments,
  submittedComments,
  setSubmittedComments,
  setState,
  showAsModal = false,
  onSubmit,
  help_type,
  conversation_id,
}: {
  user
  votedComments
  unvotedComments
  setUnvotedComments
  submittedComments
  setSubmittedComments
  setState
  showAsModal
  onSubmit
  help_type: number
  conversation_id: string
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <React.Fragment>
      {showAsModal && (
        <Button
          variant={unvotedComments.length === 0 ? "primary" : "outline"}
          sx={{ width: "100%", mt: [2] }}
          onClick={() => {
            setIsOpen(true)
          }}
        >
          Add new response
          <TbMessageDots style={{ marginLeft: "6px", position: "relative", top: "2px" }} />
        </Button>
      )}
      {!showAsModal ? (
        <SurveyComposeBox
          user={user}
          unvotedComments={unvotedComments}
          setUnvotedComments={setUnvotedComments}
          submittedComments={submittedComments}
          setSubmittedComments={setSubmittedComments}
          setState={setState}
          onSubmit={onSubmit}
          conversation_id={conversation_id}
        />
      ) : (
        <Modal
          isOpen={isOpen}
          onRequestClose={() => setIsOpen(false)}
          style={{
            overlay: {
              backgroundColor: "rgba(40, 40, 40, 0.3)",
            },
            content: {
              borderRadius: "8px",
              top: "50%",
              left: "50%",
              right: "auto",
              bottom: "auto",
              marginRight: "-50%",
              transform: "translate(-50%, -50%)",
              minHeight: "200px",
              width: "96vw", // for mobile
              maxWidth: "540px",
              overflow: "visible",
              padding: "32px 28px 28px",
            },
          }}
          contentLabel="Add new response"
        >
          <Heading as="h4" sx={surveyHeadingMini}>
            Add new response
          </Heading>

          {help_type !== 0 && (
            <Text sx={{ mb: [4] }}>
              <p>Add your perspectives, experiences, or ideas here. Good responses should:</p>
              <ul>
                <li>Raise new perspectives</li>
                <li>Be clear & concise</li>
                <li>Stand on their own (no direct replies to other statements)</li>
              </ul>
            </Text>
          )}

          <SurveyComposeBox
            user={user}
            unvotedComments={unvotedComments}
            setUnvotedComments={setUnvotedComments}
            submittedComments={submittedComments}
            setSubmittedComments={setSubmittedComments}
            setState={setState}
            onSubmit={onSubmit}
            conversation_id={conversation_id}
          />
        </Modal>
      )}
    </React.Fragment>
  )
}

export default SurveyCompose
