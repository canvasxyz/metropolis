import React, { useRef, useEffect, useState } from "react"
import { useLocalStorage } from "usehooks-ts"
import { TbMessageDots } from "react-icons/tb"
import { Box, Heading, Button, Text, Textarea, Flex, jsx } from "theme-ui"
import { toast } from "react-hot-toast"
import Modal from "react-modal"

import type { Comment } from "../../util/types"
import { DropdownButton } from "../../components/dropdown"
import SurveyCard from "./survey_card"
import api from "../../util/api"
import { surveyBox, surveyHeadingMini } from "./index"

Modal.setAppElement("#root")

const SurveyComposeBox: React.FC<{
  zid_metadata
  votedComments
  setVotedComments
  unvotedComments
  allComments
  submittedComments
  setSubmittedComments
  setState
}> = ({
  zid_metadata,
  votedComments,
  setVotedComments,
  unvotedComments,
  allComments,
  submittedComments,
  setSubmittedComments,
  setState,
}) => {
  const inputRef = useRef<HTMLInputElement>()
  const [cachedComment, setCachedComment] = useLocalStorage(
    "cachedComment-" + zid_metadata.conversation_id,
    "",
  )
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submitComment = (txt: string, vote: number) => {
    setLoading(true)
    const finalTxt = txt.replace(/\n/g, " ").trim() // replace newlines with whitespace
    const params = {
      pid: "mypid",
      conversation_id: zid_metadata.conversation_id,
      vote,
      txt: finalTxt,
      agid: 1,
    }

    return new Promise<void>((resolve, reject) =>
      api
        .post("api/v3/comments", params)
        .fail((xhr: XMLHttpRequest, evt: string, err: string) => {
          if (err.toString() === "Conflict") {
            setError("Someone has already submitted this comment")
            toast.error("Already exists")
          } else if (finalTxt === "") {
            setError("Could not add empty statement")
            toast.error("Invalid statement")
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
          }
          setVotedComments([...votedComments, comment])
          setSubmittedComments([...submittedComments, comment])
          toast.success("Statement added")

          if (
            (!zid_metadata.postsurvey_limit ||
              votedComments.length - submittedComments.length + 1 >=
                zid_metadata.postsurvey_limit) &&
            zid_metadata.postsurvey_submissions &&
            submittedComments.length + 1 >= zid_metadata.postsurvey_submissions
          ) {
            setState("postsurvey")
            history.replaceState({}, "", document.location.pathname + "#postsurvey")
          }

          resolve()
        }),
    )
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
          background: loading ? "#eee" : undefined,
        }}
        disabled={!!loading}
        rows={4}
        ref={inputRef}
        placeholder="Write a new statement..."
        defaultValue={cachedComment}
        onBlur={(e) => {
          setCachedComment(inputRef.current.value)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.metaKey) {
            e.preventDefault()
            setCachedComment("")
            submitComment(inputRef.current.value, 1)
              .then(() => {
                inputRef.current.value = ""
                setError("")
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
      <Box sx={{ mb: [3] }}>
        <DropdownButton
          sx={{ display: "inline-block" }}
          options={[
            {
              name: "Add statement",
              onClick: () => {
                submitComment(inputRef.current.value, 1)
                  .then(() => {
                    inputRef.current.value = ""
                    setError("")
                  })
                  .finally(() => {
                    setLoading(false)
                    inputRef.current.focus()
                  })
              },
              default: true,
            },
            {
              name: "Add & vote disagree",
              onClick: () => {
                submitComment(inputRef.current.value, -1)
                  .then(() => {
                    inputRef.current.value = ""
                    setError("")
                  })
                  .finally(() => {
                    setLoading(false)
                  })
              },
            },
          ]}
        />
      </Box>
      <Box>{error && <Box sx={{ mt: [2], color: "mediumRed" }}>{error}</Box>}</Box>
    </form>
  )
}

const SurveyCompose = ({
  zid_metadata,
  votedComments,
  unvotedComments,
  setVotedComments,
  submittedComments,
  allComments,
  setSubmittedComments,
  setState,
  showAsModal = false,
}) => {
  const [showIntro, setShowIntro] = useState(false)
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
          Add new statement
          <TbMessageDots style={{ marginLeft: "6px", position: "relative", top: "2px" }} />
        </Button>
      )}
      {!showAsModal ? (
        <SurveyComposeBox
          zid_metadata={zid_metadata}
          votedComments={votedComments}
          setVotedComments={setVotedComments}
          unvotedComments={unvotedComments}
          allComments={allComments}
          submittedComments={submittedComments}
          setSubmittedComments={setSubmittedComments}
          setState={setState}
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
          contentLabel="Add new statement"
        >
          <Heading as="h4" sx={surveyHeadingMini}>
            Add new statement
          </Heading>

          {zid_metadata.help_type !== 0 && (
            <Text sx={{ mb: [4] }}>
              <p>Add your perspectives, experiences, or ideas here. Good statements should:</p>
              <ul>
                <li>Raise new perspectives</li>
                <li>Be clear & concise</li>
                <li>Stand on their own (no direct replies to other statements)</li>
              </ul>
            </Text>
          )}

          <SurveyComposeBox
            zid_metadata={zid_metadata}
            votedComments={votedComments}
            setVotedComments={setVotedComments}
            unvotedComments={unvotedComments}
            allComments={allComments}
            submittedComments={submittedComments}
            setSubmittedComments={setSubmittedComments}
            setState={setState}
          />
        </Modal>
      )}
    </React.Fragment>
  )
}

export default SurveyCompose
