/** @jsx jsx */

import React, { useCallback, useEffect, useState, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { connect, useDispatch, useSelector } from "react-redux"
import { Box, Heading, Button, Text, Textarea, Flex, Link, jsx } from "theme-ui"
import { useHistory } from "react-router-dom"

import api from "../../util/api"
import type { RootState, Comment, Conversation } from "../../util/types"
import { populateZidMetadataStore, resetMetadataStore } from "../../actions"
import { TbChevronsDown, TbChevronsUp, TbSettings } from "react-icons/tb"

import SurveyCards from "./survey_cards"
import SurveyCompose from "./survey_compose"
import SurveyFloatingPromptBox from "./survey_floating_prompt"
import PostSurvey from "./survey_post"

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
  mt: [0],
  mb: [4],
}

export const surveyBox = {
  padding: "24px 32px 25px",
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
          : [...unvotedComments]
      )
    })
}

const Survey: React.FC<{ match: { params: { conversation_id: string } } }> = ({
  match: {
    params: { conversation_id },
  },
}) => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const hist = useHistory()
  const dispatch = useDispatch()
  const [unvotedComments, setUnvotedComments] = useState([])
  const [votedComments, setVotedComments] = useState([])
  const [submittedComments, setSubmittedComments] = useState([])
  const [conversation, setConversation] = useState<Conversation>()
  const [state, setState] = useState<SurveyState>("loading")
  const [votingAfterPostSurvey, setVotingAfterPostSurvey] = useState(false)

  const { zid_metadata } = useSelector((state: RootState) => state.zid_metadata)
  const { user } = useSelector((state: RootState) => state.user)

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
            newUnvotedComments[0]?.tid
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

  const cardsText = zid_metadata.postsurvey_limit
    ? `a batch of ${zid_metadata.postsurvey_limit} statements`
    : "statements by other people"

  return (
    <Box
      sx={{
        margin: "0 auto",
        maxWidth: "30em",
        letterSpacing: "-0.06px",
        lineHeight: ["1.4", "1.5"],
      }}
    >
      <Box>
        {(zid_metadata.is_mod || zid_metadata.is_owner) && (
          <Button
            variant="outlineDark"
            sx={{ position: "fixed", bottom: [4], right: [4], px: [2], pt: "4px", pb: "3px" }}
            onClick={() => hist.push(`/m/${zid_metadata.conversation_id}`)}
          >
            <TbSettings /> Edit
          </Button>
        )}
        <SurveyFloatingPromptBox
          zid_metadata={zid_metadata}
          votedComments={votedComments}
          unvotedComments={unvotedComments}
          submittedComments={submittedComments}
          state={state}
          goTo={goTo}
        />
      </Box>
      {(state === "voting" || state === "postsurvey") && (
        <Box>
          <Heading as="h3" sx={{ ...surveyHeading, mb: [4] }}>
            {!zid_metadata.topic ? "About this survey" : zid_metadata.topic}
          </Heading>
        </Box>
      )}
      {state === "voting" && (
        <React.Fragment>
          {zid_metadata?.description ? (
            <Text className="react-markdown">
              <ReactMarkdown children={zid_metadata.description} remarkPlugins={[remarkGfm]} />
            </Text>
          ) : (
            <Box>
              <Text sx={{ mt: [4], mb: [2] }}>
                This is a collaborative survey, where you can contribute statements for everyone to
                vote on.
              </Text>
              <Text sx={{ my: [2] }}>
                You’ll be shown {cardsText}, and asked to <strong>Agree</strong>,{" "}
                <strong>Disagree</strong>, or <strong>Skip</strong>.
              </Text>
              <Text>
                <ul>
                  <li>
                    If you generally agree, select Agree. You can also check a box to show if you
                    identify strongly.
                  </li>
                  <li>
                    If you disagree or think the statement doesn’t make sense, select Disagree.
                  </li>
                  <li>If you don’t think it’s relevant or are unsure, select Skip.</li>
                </ul>
              </Text>
            </Box>
          )}
          <Box sx={{ mt: [5], mb: [5] }}>
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
                    newUnvotedComments[0]?.tid
                  )
                }
              }}
              conversation_id={conversation_id}
              zid_metadata={zid_metadata}
            />
          </Box>
        </React.Fragment>
      )}

      {state === "postsurvey" && (
        <Box sx={{ mt: [5], mb: [5] }}>
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
        </Box>
      )}

      {state === "voting" && (
        <Box sx={{ mb: [5] }}>
          {!zid_metadata.auth_needed_to_write || !!user?.email || !!user?.xInfo ? (
            <Box>
              <Box sx={{ mt: [3], mb: [3] }}>
                Are your perspectives or experiences missing? If so, add them here:
              </Box>
              <SurveyCompose
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
                    document.location.pathname
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

export default connect((state: RootState) => ({ z: state.zid_metadata, u: state.user }))(Survey)
