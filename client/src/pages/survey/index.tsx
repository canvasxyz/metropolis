/** @jsx jsx */

import React, { useCallback, useEffect, useState, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { connect } from "react-redux"
import { Box, Heading, Button, Text, Textarea, Flex, Link, jsx } from "theme-ui"
import { useHistory } from "react-router-dom"

import api from "../../util/api"
import type { Comment, Conversation } from "../../util/types"
import { populateZidMetadataStore, resetMetadataStore } from "../../actions"
import { TbChevronsDown, TbChevronsUp, TbSettings } from "react-icons/tb"

import SurveyCards from "./survey_cards"
import SurveyCompose from "./survey_compose"
import PostSurvey from "./survey_post"
import { RootState } from "../../store"
import { useAppDispatch, useAppSelector } from "../../hooks"

// TODO: enforce comment too long on backend

type SurveyState = "loading" | "voting" | "postsurvey"

export const surveyHeading = {
  fontSize: [4],
  lineHeight: "1.35",
  mt: [1, 5],
  mb: [5],
}

export const surveyHeadingMini = {
  fontSize: [3],
  lineHeight: "1.35",
  mt: 0,
  mb: "0.5em",
}

export const surveyBox = {
  padding: "24px 32px 20px",
  border: "1px solid",
  borderColor: "lighterGray",
  bg: "bgGray",
  borderRadius: "8px",
  mt: [3, null, 4],
  mb: [3, null, 4],
}

// reorder the next comments according to the backend api
const selectNextComment = (unvotedComments, setUnvotedComments, conversation_id, withoutTid) => {
  api
    .get("api/v3/nextComment", {
      conversation_id,
      not_voted_by_pid: "mypid",
      without: [withoutTid],
    })
    .then((nextComment) => {
      const trimmedUnvotedComments = unvotedComments.filter((c) => c.tid !== nextComment.tid)
      // check: unvotedComments should contain nextComment, but
      // there could be a race condition if selectNextComment
      // is called many times within a short interval
      if (trimmedUnvotedComments.length !== unvotedComments.length - 1) {
        console.warn("Unexpected: nextComment not found in unvoted comments")
      }
      setUnvotedComments(
        trimmedUnvotedComments.length === unvotedComments.length - 1
          ? [trimmedUnvotedComments[0], nextComment, ...trimmedUnvotedComments.slice(1)]
          : [...unvotedComments],
      )
    })
}

type SurveyProps = { match: { params: { conversation_id: string } } }
const Survey = ({
  match: {
    params: { conversation_id },
  },
}: SurveyProps) => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const hist = useHistory()
  const dispatch = useAppDispatch()
  const [unvotedComments, setUnvotedComments] = useState([])
  const [votedComments, setVotedComments] = useState([])
  const [submittedComments, setSubmittedComments] = useState([])
  const [state, setState] = useState<SurveyState>("loading")
  const [votingAfterPostSurvey, setVotingAfterPostSurvey] = useState(false)

  const { zid_metadata } = useAppSelector((state: RootState) => state.zid_metadata)
  const { user } = useAppSelector((state: RootState) => state.user)

  useEffect(() => {
    dispatch(populateZidMetadataStore(conversation_id))
    return () => {
      dispatch(resetMetadataStore())
    }
  }, [conversation_id])

  useEffect(() => {
    if (!zid_metadata || Object.keys(zid_metadata).length === 0) return

    Promise.all([
      api.get("api/v3/comments", {
        conversation_id,
        not_voted_by_pid: "mypid",
      }),
      api.get("api/v3/comments", {
        conversation_id,
      }),
      api.get("api/v3/comments", {
        conversation_id,
        submitted_by_pid: "mypid",
      }),
      api.get("api/v3/nextComment", {
        conversation_id,
        not_voted_by_pid: "mypid",
        // without: number[]
      }),
    ]).then(([unvotedComments, allComments, allSubmissions, firstComment]) => {
      const unvotedCommentIds = unvotedComments.map((c: Comment) => c.tid)
      const trimmedUnvotedComments = unvotedComments.filter((c) => c.tid !== firstComment.tid)

      // select the first comment using backend api
      // check: unvotedComments should contain firstComment
      if (trimmedUnvotedComments.length !== unvotedComments.length - 1) {
        console.warn("Unexpected: nextComment not found in unvoted comments")
      }
      const newUnvotedComments =
        trimmedUnvotedComments.length === unvotedComments.length - 1
          ? [firstComment, ...trimmedUnvotedComments]
          : [...unvotedComments]

      setUnvotedComments(newUnvotedComments)
      setVotedComments(allComments.filter((c: Comment) => unvotedCommentIds.indexOf(c.tid) === -1))
      setSubmittedComments(allSubmissions) // TODO: keep this updated

      // select next comment using backend api

      if (unvotedComments.length > 2) {
        setTimeout(() => {
          selectNextComment(
            newUnvotedComments,
            setUnvotedComments,
            zid_metadata.conversation_id,
            newUnvotedComments[0]?.tid,
          )
        }, 0)
      }

      setState("voting")
    })

    const onpopstate = (event) => {
      const newHash = document.location.hash.slice(1)
      if (newHash && ["voting", "postsurvey"].indexOf(newHash) !== -1) {
        setState(newHash as SurveyState)
      } else if (newHash === "") {
        setState("voting")
      } else {
        console.error("Invalid state:", newHash)
      }
    }
    window.addEventListener("popstate", onpopstate)
    return () => window.removeEventListener("popstate", onpopstate)
  }, [zid_metadata && Object.keys(zid_metadata).length > 0])

  const goTo = useCallback((state) => {
    // preserve the root page
    const hash = document.location.hash.slice(1)
    setState(state)
    history.pushState({}, "", document.location.pathname + "#" + state)
  }, [])

  return (
    <Box>
      {state === "voting" && (
        <React.Fragment>
          <SurveyCards
            votedComments={votedComments}
            unvotedComments={unvotedComments}
            setVotedComments={setVotedComments}
            submittedComments={submittedComments}
            setSubmittedComments={setSubmittedComments}
            user={user}
            goTo={goTo}
            onVoted={(commentId: string) => {
              const comment = unvotedComments.find((c) => c.tid === commentId)
              const newUnvotedComments = unvotedComments.filter((c) => c.tid !== commentId)
              setUnvotedComments(newUnvotedComments)
              if (!comment) return
              const newVotedComments = [...votedComments, comment]
              setVotedComments(newVotedComments)

              if (
                zid_metadata.postsurvey &&
                newVotedComments.length > zid_metadata.postsurvey_limit &&
                !votingAfterPostSurvey
              ) {
                goTo("postsurvey")
              } else {
                selectNextComment(
                  newUnvotedComments,
                  setUnvotedComments,
                  zid_metadata.conversation_id,
                  newUnvotedComments[0]?.tid,
                )
              }
            }}
            conversation_id={conversation_id}
            zid_metadata={zid_metadata}
          />
        </React.Fragment>
      )}

      {state === "postsurvey" && (
        <PostSurvey
          votedComments={votedComments}
          unvotedComments={unvotedComments}
          submittedComments={submittedComments}
          user={user}
          goTo={goTo}
          setVotingAfterPostSurvey={setVotingAfterPostSurvey}
          conversation_id={conversation_id}
          zid_metadata={zid_metadata}
        />
      )}

      {state === "voting" && (
        <Box sx={{ mb: [5] }}>
          {!zid_metadata.auth_needed_to_write ||
          !!user?.email ||
          !!user?.githubUserId ||
          !!user?.xInfo ? (
            <Box>
              <Box sx={{ mt: [4], mb: [3] }}>Do you have remarks to add? If so, add them here:</Box>
              <SurveyCompose
                key={zid_metadata.conversation_id}
                zid_metadata={zid_metadata}
                votedComments={votedComments}
                unvotedComments={unvotedComments}
                setVotedComments={setVotedComments}
                allComments={votedComments.concat(unvotedComments)}
                submittedComments={submittedComments}
                setSubmittedComments={setSubmittedComments}
                setState={setState}
              />
            </Box>
          ) : (
            <Box>
              <Button
                variant="outlineGray"
                sx={{ width: "100%" }}
                onClick={() =>
                  (document.location = `/createuser?from=${encodeURIComponent(
                    document.location.pathname,
                  )}`)
                }
              >
                Create an account to add statements
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

export default Survey
