/** @jsx jsx */

import React, { useEffect, useState, useRef } from "react"
import { connect, useDispatch, useSelector } from "react-redux"
import Modal from "react-modal"
import { Box, Heading, Button, Text, Textarea, Flex, Link, jsx } from "theme-ui"

import api from "../../util/api"
import type { RootState, Comment, Conversation } from "../../util/types"
import { populateZidMetadataStore, resetMetadataStore } from "../../actions"
import { TbChevronsDown, TbChevronsUp } from "react-icons/tb"

import SurveyIntro from "./survey_intro"
import SurveyInstructions from "./survey_instructions"
import SurveyLogin from "./survey_login"
import SurveyCards from "./survey_cards"
import SurveyCompose from "./survey_compose"

// TODO: enforce comment too long on backend

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

Modal.setAppElement("#root")

const CollapsibleIntro = ({ zid_metadata, votedComments, setVotedComments }) => {
  const [showIntro, setShowIntro] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <React.Fragment>
      <Box>
        {zid_metadata?.description && (
          <Button sx={{ mr: [2] }} variant="outlineGray" onClick={() => setShowIntro(!showIntro)}>
            {showIntro ? "Hide intro" : "Show intro"}
            {showIntro ? (
              <TbChevronsUp style={{ position: "relative", top: "3px", marginLeft: "4px" }} />
            ) : (
              <TbChevronsDown style={{ position: "relative", top: "2px", marginLeft: "4px" }} />
            )}
          </Button>
        )}
        <Button
          variant="primary"
          onClick={() => {
            setIsOpen(true)
          }}
        >
          Add new comment
        </Button>
      </Box>
      {showIntro && (
        <Box sx={{ ...surveyBox }}>
          <Text>{zid_metadata.description}</Text>
        </Box>
      )}
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
        contentLabel="Add new comment"
      >
        <Heading as="h4" sx={surveyHeadingMini}>
          Add new comment
        </Heading>
        <SurveyCompose
          zid_metadata={zid_metadata}
          votedComments={votedComments}
          setVotedComments={setVotedComments}
        />
      </Modal>
    </React.Fragment>
  )
}

const Survey: React.FC<{ match: { params: { conversation_id: string } } }> = ({
  match: {
    params: { conversation_id },
  },
}) => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const dispatch = useDispatch()
  const [unvotedComments, setUnvotedComments] = useState([])
  const [votedComments, setVotedComments] = useState([])
  const [conversation, setConversation] = useState<Conversation>()

  const { zid_metadata } = useSelector((state: RootState) => state.zid_metadata)
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
    })
  }, [])

  const onVoted = (commentId: string) => {
    const comment = unvotedComments.find((c) => c.tid === commentId)
    setUnvotedComments(unvotedComments.filter((c) => c.tid !== commentId))
    if (!comment) return
    setVotedComments([...votedComments, comment])
  }

  type SurveyState = "loading" | "intro" | "instructions" | "login" | "voting" | "redirect"
  const [state, setState] = useState<SurveyState>("loading")
  useEffect(() => {
    const hash = document.location.hash.slice(1)
    if (hash && ["intro", "instructions", "login", "voting", "redirect"].indexOf(hash) !== -1) {
      setState(hash as SurveyState)
    } else {
      setState("intro")
    }

    const onpopstate = (event) => {
      const newHash = document.location.hash.slice(1)
      if (
        newHash &&
        ["intro", "instructions", "login", "voting", "redirect"].indexOf(newHash) !== -1
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

  const goTo = (state) => {
    // preserve the root page
    const hash = document.location.hash.slice(1)
    setState(state)
    history.pushState({}, "", document.location.pathname + "#" + state)
  }

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
      {state === "intro" && (
        <SurveyIntro zid_metadata={zid_metadata} onNext={() => goTo("instructions")} />
      )}
      {state === "instructions" && (
        <SurveyInstructions
          onNext={() => goTo("login")}
          onPrev={() => goTo("intro")}
          limit={null /* TODO */}
        />
      )}
      {state === "login" && (
        <SurveyLogin onNext={() => goTo("voting")} onPrev={() => goTo("instructions")} />
      )}
      {state === "voting" && (
        <React.Fragment>
          <Heading as="h3" sx={{ ...surveyHeading, mb: [4] }}>
            {!zid_metadata.topic ? "About this survey" : zid_metadata.topic}
          </Heading>
          <CollapsibleIntro
            zid_metadata={zid_metadata}
            votedComments={votedComments}
            setVotedComments={setVotedComments}
          />
          <Box sx={{ mt: [5] }}>
            <SurveyCards
              votedComments={votedComments}
              unvotedComments={unvotedComments}
              onVoted={onVoted}
              conversation_id={conversation_id}
            />
          </Box>
        </React.Fragment>
      )}
    </Box>
  )
}

export default connect((state: RootState) => state.zid_metadata)(Survey)
