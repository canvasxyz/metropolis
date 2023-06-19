/** @jsx jsx */

import React, { useCallback, useEffect, useState, useRef } from "react"
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

  const { zid_metadata } = useSelector((state: RootState) => state.zid_metadata)
  const { user } = useSelector((state: RootState) => state.user)

  useEffect(() => {
    dispatch(populateZidMetadataStore(conversation_id))
    return () => {
      dispatch(resetMetadataStore())
    }
  }, [conversation_id])

  useEffect(() => {
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
    ]).then(([unvotedComments, allComments]) => {
      const unvotedCommentIds = unvotedComments.map((c: Comment) => c.tid)
      setUnvotedComments(unvotedComments)
      setVotedComments(allComments.filter((c: Comment) => unvotedCommentIds.indexOf(c.tid) === -1))

      const hash = document.location.hash.slice(1)
      if (unvotedComments.length === 0 && allComments.length > 0) {
        setState("voting")
      } else if (
        hash &&
        ["intro", "instructions", "login", "voting", "postsurvey"].indexOf(hash) !== -1
      ) {
        setState(hash as SurveyState)
      } else {
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
  }, [])

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
        maxWidth: "29em",
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
        <React.Fragment>
          <Heading as="h3" sx={{ ...surveyHeading, mb: [4] }}>
            {!zid_metadata.topic ? "About this survey" : zid_metadata.topic}
          </Heading>
          <Box sx={{ mt: [5] }}>
            <SurveyCards
              votedComments={votedComments}
              unvotedComments={unvotedComments}
              setVotedComments={setVotedComments}
              user={user}
              onVoted={(commentId: string) => {
                const comment = unvotedComments.find((c) => c.tid === commentId)
                setUnvotedComments(unvotedComments.filter((c) => c.tid !== commentId))
                if (!comment) return
                setVotedComments([...votedComments, comment])
              }}
              conversation_id={conversation_id}
              zid_metadata={zid_metadata}
            />
          </Box>
        </React.Fragment>
      )}
    </Box>
  )
}

export default connect((state: RootState) => ({ z: state.zid_metadata, u: state.user }))(Survey)
