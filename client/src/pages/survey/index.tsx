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

import SurveyIntro from "./survey_intro"
import SurveyInstructions from "./survey_instructions"
import SurveyLogin from "./survey_login"
import SurveyCards from "./survey_cards"
import PostSurvey from "./survey_post"

// TODO: enforce comment too long on backend

type SurveyState = "loading" | "intro" | "instructions" | "login" | "voting" | "postsurvey"

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
        lastServerToken: new Date(0).getTime(),
        not_voted_by_pid: "mypid",
        conversation_id,
      }),
      api.get("api/v3/comments", {
        lastServerToken: new Date(0).getTime(),
        conversation_id,
      }),
      api.get("api/v3/comments", {
        lastServerToken: new Date(0).getTime(),
        voted_by_pid: "mypid",
        conversation_id,
      }),
    ]).then(([unvotedComments, allComments, allSubmissions]) => {
      const unvotedCommentIds = unvotedComments.map((c: Comment) => c.tid)
      setUnvotedComments(unvotedComments)
      setVotedComments(allComments.filter((c: Comment) => unvotedCommentIds.indexOf(c.tid) === -1))

      const hash = document.location.hash.slice(1)
      if (
        ((unvotedComments.length === 0 && allComments.length > 0) || // voted on all comments
          (zid_metadata.postsurvey_limit &&
            allComments.length - unvotedComments.length >= zid_metadata.postsurvey_limit)) && // or, voted on enough comments
        (!zid_metadata.postsurvey_submissions || // no submissions requirement
          allSubmissions.length >= zid_metadata.postsurvey_submissions) && // or, made enough submissions
        zid_metadata.postsurvey
      ) {
        // voted on enough/all comments AND made enough submissions, initialize to postsurvey
        setState("postsurvey")
        history.replaceState({}, "", document.location.pathname + "#postsurvey")
      } else if (allComments.length - unvotedComments.length > 0 || allSubmissions.length > 0) {
        // voted on some comments OR made some submissions, initialize to voting
        setState("voting")
        history.replaceState({}, "", document.location.pathname + "#voting")
      } else if (
        // voted on not enough comments, initialize to previous url hash
        hash &&
        ["intro", "instructions", "login", "voting", "postsurvey"].indexOf(hash) !== -1
      ) {
        setState(hash as SurveyState)
      } else {
        // new user, initialize to intro
        setState("intro")
      }
    })

    const onpopstate = (event) => {
      const newHash = document.location.hash.slice(1)
      if (
        newHash &&
        ["intro", "instructions", "login", "voting", "postsurvey"].indexOf(newHash) !== -1
      ) {
        setState(newHash as SurveyState)
      } else if (newHash === "") {
        setState("intro")
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
    <Box
      sx={{
        margin: "0 auto",
        maxWidth: "30em",
        letterSpacing: "-0.06px",
        fontSize: ["1em", "1.05em"],
        lineHeight: ["1.4", "1.5"],
      }}
    >
      <Box>
        {(zid_metadata.is_mod || zid_metadata.is_owner) && (
          <Button
            variant="outlineDark"
            sx={{ position: "fixed", top: [3], right: [3], px: [2], pt: "4px", pb: "3px" }}
            onClick={() => hist.push(`/m/${zid_metadata.conversation_id}`)}
          >
            <TbSettings /> Admin Panel
          </Button>
        )}
      </Box>
      {state === "intro" && (
        <SurveyIntro zid_metadata={zid_metadata} onNext={() => goTo("instructions")} />
      )}
      {state === "instructions" && (
        <SurveyInstructions
          onNext={() => goTo("voting") /* goTo("login") */}
          onPrev={() => goTo("intro")}
          limit={null /* TODO */}
        />
      )}
      {state === "login" && (
        <SurveyLogin onNext={() => goTo("voting")} onPrev={() => goTo("instructions")} />
      )}
      {(state === "voting" || state === "postsurvey") && (
        <Box>
          <Heading as="h3" sx={{ ...surveyHeading, mb: [4] }}>
            {!zid_metadata.topic ? "About this survey" : zid_metadata.topic}
          </Heading>
        </Box>
      )}
      {state === "voting" && (
        <React.Fragment>
          <Box sx={{ fontSize: "92%", mt: [3] }}>
            {zid_metadata.survey_caption ? (
              <ReactMarkdown children={zid_metadata.survey_caption} remarkPlugins={[remarkGfm]} />
            ) : (
              <Text>Please review the statements below and add your own:</Text>
            )}
          </Box>
          <Box sx={{ mt: [5], mb: [5] }}>
            <SurveyCards
              votedComments={votedComments}
              unvotedComments={unvotedComments}
              setVotedComments={setVotedComments}
              user={user}
              goTo={goTo}
              onVoted={(commentId: string) => {
                const comment = unvotedComments.find((c) => c.tid === commentId)
                setUnvotedComments(unvotedComments.filter((c) => c.tid !== commentId))
                if (!comment) return
                const newVotedComments = [...votedComments, comment]
                setVotedComments(newVotedComments)

                if (
                  zid_metadata.postsurvey &&
                  newVotedComments.length > zid_metadata.postsurvey_limit &&
                  !votingAfterPostSurvey
                )
                  goTo("postsurvey")
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
            user={user}
            goTo={goTo}
            setVotingAfterPostSurvey={setVotingAfterPostSurvey}
            conversation_id={conversation_id}
            zid_metadata={zid_metadata}
          />
        </Box>
      )}
    </Box>
  )
}

export default connect((state: RootState) => ({ z: state.zid_metadata, u: state.user }))(Survey)
