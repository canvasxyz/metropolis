/** @jsx jsx */

import React, { useCallback, useEffect, useState } from "react"
import { Box, Button, jsx } from "theme-ui"

import api from "../../util/api"
import type { Comment } from "../../util/types"

import { PolisSurveyCards } from "./polis_cards"
import { PolisSurveyCompose } from "./survey_compose"
import { PolisPostSurvey } from "./survey_post"
import { RootState } from "../../store"
import { useAppSelector, useAppDispatch } from "../../hooks"
import { handleSubmitNewComment } from "../../actions"

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
  padding: "26px 32px 24px",
  border: "1px solid",
  borderColor: "lighterGray",
  bg: "bgOffWhite",
  borderRadius: "8px",
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
        trimmedUnvotedComments.length === unvotedComments.length - 1 &&
          trimmedUnvotedComments.length > 0
          ? [trimmedUnvotedComments[0], nextComment, ...trimmedUnvotedComments.slice(1)]
          : [...unvotedComments],
      )
    })
}

type SurveyProps = {
  conversation_id: string
  help_type: number
  postsurvey: string
  // why can't this just be returned from the backend as a number?
  postsurvey_limit: string
  postsurvey_redirect: string
  auth_needed_to_write: boolean
}

const PolisSurvey = ({
  conversation_id,
  help_type,
  postsurvey,
  postsurvey_limit,
  postsurvey_redirect,
  auth_needed_to_write,
}: SurveyProps) => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [unvotedComments, setUnvotedComments] = useState([])
  const [votedComments, setVotedComments] = useState([])
  const [submittedComments, setSubmittedComments] = useState([])
  const [state, setState] = useState<SurveyState>("loading")
  const [votingAfterPostSurvey, setVotingAfterPostSurvey] = useState(false)

  const { user } = useAppSelector((state: RootState) => state.user)
  const dispatch = useAppDispatch()

  useEffect(() => {
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
            conversation_id,
            newUnvotedComments[0]?.tid,
          )
        }, 0)
      }

      setState("voting")
    })

    const onpopstate = () => {
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
  }, [])

  const goTo = useCallback((state) => {
    // preserve the root page
    setState(state)
    history.pushState({}, "", document.location.pathname + "#" + state)
  }, [])

  const voteDisabled = auth_needed_to_write && !user

  return (
    <Box>
      {state === "voting" && (
        <React.Fragment>
          <PolisSurveyCards
            votedComments={votedComments}
            unvotedComments={unvotedComments}
            goTo={goTo}
            postsurvey={postsurvey}
            postsurvey_redirect={postsurvey_redirect}
            voteDisabled={voteDisabled}
            onVoted={(commentId: string) => {
              const comment = unvotedComments.find((c) => c && c.tid === commentId)
              const newUnvotedComments = unvotedComments.filter((c) => c && c.tid !== commentId)
              setUnvotedComments(newUnvotedComments)
              if (!comment) return
              const newVotedComments = [...votedComments, comment]
              setVotedComments(newVotedComments)

              if (
                postsurvey &&
                newVotedComments.length > parseInt(postsurvey_limit, 10) &&
                !votingAfterPostSurvey
              ) {
                goTo("postsurvey")
              } else {
                selectNextComment(
                  newUnvotedComments,
                  setUnvotedComments,
                  conversation_id,
                  newUnvotedComments[0]?.tid,
                )
              }
            }}
            conversation_id={conversation_id}
          />
        </React.Fragment>
      )}
      {state === "postsurvey" && (
        <PolisPostSurvey
          votedComments={votedComments}
          unvotedComments={unvotedComments}
          submittedComments={submittedComments}
          goTo={goTo}
          setVotingAfterPostSurvey={setVotingAfterPostSurvey}
          postsurvey={postsurvey}
          postsurvey_redirect={postsurvey_redirect}
        />
      )}

      {state === "voting" && (
        <Box sx={{ position: "relative", zIndex: 10, marginTop: "10px" }}>
          {!auth_needed_to_write ||
          !!user?.email ||
          !!user?.githubUserId ||
          !!user?.xInfo ? (
            <Box sx={{ pt: [3] }}>
              <Box sx={{ fontSize: "0.94em", mb: "15px" }}>
                Are your perspectives or experiences missing from this conversation? If so, add them
                in the box below, one at a time. Others will vote on each statement individually.
              </Box>
              <PolisSurveyCompose
                user={user}
                key={conversation_id}
                votedComments={votedComments}
                unvotedComments={unvotedComments}
                setUnvotedComments={setUnvotedComments}
                submittedComments={submittedComments}
                setSubmittedComments={setSubmittedComments}
                setState={setState}
                showAsModal={false}
                onSubmit={() => {
                  dispatch(handleSubmitNewComment(conversation_id))
                }}
                conversation_id={conversation_id}
                help_type={help_type}
              />
            </Box>
          ) : (
            <Box sx={{ mt: "24px" }}>
              <Box sx={{ fontSize: "0.94em", mb: "15px" }}>
                Are your perspectives or experiences missing from this conversation? If so, add them
                in the box below, one at a time. Others will vote on each statement individually.
              </Box>
              <Button
                variant="buttons.outlineSecondary"
                sx={{ py: "6px", fontWeight: 500, width: "100%" }}
                onClick={() =>
                  (document.location = `/api/v3/github_oauth_init?dest=${window.location.href}`)
                }
              >
                Sign in to respond
              </Button>
            </Box>
          )}
        </Box>
      )}

      {state === "loading" && <Box>Loading...</Box>}
    </Box>
  )
}

export default PolisSurvey
