/** @jsx jsx */

import { RouteComponentProps, Link } from "react-router-dom"
import React, { useEffect, useState, useRef } from "react"
import PropTypes from "prop-types"
import { ConnectedProps, connect } from "react-redux"
import { Box, Grid, Input, Textarea, Label, Heading, Button, Text, Flex, jsx } from "theme-ui"
import { TbExternalLink, TbUser, TbCheckbox } from "react-icons/tb"

import {
  populateConversationsStore,
  handleCreateConversationSubmit,
  handleCloseConversation,
  handleReopenConversation,
  populateConversationStatsStore,
} from "../actions"
import { DropdownMenu } from "../components/dropdown"

import Url from "../util/url"
import ConversationRow from "../components/conversation_row"
import { AppDispatch, RootState } from "../store"

const connector = connect((state: RootState) => state.user)
type PropsFromRedux = ConnectedProps<typeof connector>
type CreateConversationProps = PropsFromRedux & { dispatch: AppDispatch }

const CreateConversation = ({ dispatch, user }: CreateConversationProps) => {
  const [step, setStep] = useState<number>(0)
  const [prefillSelection, setPrefillSelection] = useState<number>()
  const descriptionRef = useRef()

  const [showExample, setShowExample] = useState<boolean>(false)
  const [title, setTitle] = useState<string>()
  const [description, setDescription] = useState<string>()

  useEffect(() => {
    const onpopstate = (event: any) => {
      if (event.state === "select") {
        setStep(0)
      } else if (event.state === "customize") {
        setStep(1)
      }
    }
    window.onpopstate = onpopstate
    history.replaceState("select", null, "")
    return () => {
      window.removeEventListener("onpopstate", onpopstate, false)
    }
  }, [])

  const prefillOptions = [
    {
      title: "Member Survey",
      prefillTitle: "My Group's Member Survey",
      prefillIntro: "We're trying to learn more about our members and what they're looking for.",
      prefill:
        "What makes you excited about being a part of this group? Which events have you enjoyed the most?",
      prefillExtra: "What would you like to see us do in the future?",
      bestFor: "General Organizations",
    },
    {
      title: "User Feedback",
      prefillTitle: "My User Feedback Survey",
      prefillIntro: "We'd like to learn more about what users think of our product.",
      prefill: "How could we improve our user interface? Which features should we prioritize?",
      prefillExtra: "What's the overall impression you get when using our product?",
      bestFor: "Startups, Product Teams",
    },
    {
      title: "Delegate Profiles",
      prefillTitle: "My Delegate Onboarding Event",
      prefillIntro: "We'd like to learn more about our delegates.",
      prefill:
        "What are the core principles that you want to express in governance? What motivates you to participate in this organization?",
      prefillExtra: "What should delegates' responsibilities include?",
      bestFor: "DAOs, Formal Governance",
    },
    {
      title: "Constitution Building",
      prefillTitle: "My Organization's Constitutional Principles",
      prefillIntro: "We're running a collaborative survey to help write our updated constitution.",
      prefill:
        "Which values, practices, and processes should we include in our constitution? What examples should we be inspired by?",
      prefillExtra: "",
      bestFor: "Formal Governance",
    },
    {
      title: "Custom",
      prefillPlaceholder:
        "Write and customize your own survey. You can use the case studies in our documentation as a reference.",
      prefillIntro: "",
      prefill: "",
      prefillExtra: "",
      bestFor: "Everyone Else",
    },
  ]

  return (
    <Box sx={{ mt: [4, null, 5], mb: [5] }}>
      <Flex>
        <Heading as="h1" sx={{ flex: 1, position: "relative", top: "4px" }}>
          Create New Conversation
        </Heading>
      </Flex>

      <Box sx={{ mt: 5, mb: 6 }}>
        <Flex sx={{ mb: 4 }}>
          <Box
            sx={{
              mr: 4,
              pb: 1,
              fontWeight: "600",
              borderBottom: step === 0 ? "2px solid" : "",
              borderBottomColor: "body",
              cursor: "pointer",
              opacity: step === 0 ? 1 : 0.4,
            }}
            onClick={() => {
              setStep(0)
              history.pushState("select", null, "")
            }}
          >
            Select Template
          </Box>
          <Box
            sx={{
              mr: 4,
              pb: 1,
              fontWeight: "600",
              borderBottom: step === 1 ? "2px solid" : "",
              borderBottomColor: "body",
              opacity: step === 1 ? 1 : 0.4,
            }}
          >
            Customize
          </Box>
        </Flex>
        {step === 0 && (
          <Grid width={260}>
            {prefillOptions.map((option, index) => (
              <Box
                key={index}
                sx={{
                  border: "1px solid",
                  borderColor: "lighterGray",
                  borderRadius: "7px",
                  cursor: "pointer",
                  lineHeight: "1.4",
                  "&:hover": { borderColor: "primary" },
                  px: [4],
                  py: [3],
                }}
                onClick={() => {
                  setPrefillSelection(index)
                  setStep(1)
                  if (window.history && window.history.pushState) {
                    history.pushState("customize", null, "")
                  }
                }}
              >
                <Box sx={{ my: [1], fontWeight: "700" }}>{option.title}</Box>
                <Box sx={{ my: [2], fontSize: ".9em", fontStyle: "italic", color: "mediumGray" }}>
                  {option.prefill || option.prefillPlaceholder}
                </Box>
                {option.bestFor && (
                  <Box
                    sx={{
                      fontSize: ".9em",
                      color: "mediumGray",
                      fontWeight: "600",
                      mb: [2],
                    }}
                  >
                    Best for: {option.bestFor}
                  </Box>
                )}
              </Box>
            ))}
          </Grid>
        )}
        {step === 1 && (
          <Box>
            <Label sx={{ display: "block", mb: [5] }}>
              <Box sx={{ fontWeight: "700", mb: [1] }}>Title</Box>
              {/*<Box sx={{ fontSize: "0.92em", fontStyle: "italic" }}>
                A descriptive name for your survey.
                </Box>*/}
              <Box>
                <Input
                  placeholder={prefillOptions[prefillSelection].prefillTitle}
                  onChange={(i) => {
                    setTitle(i.target.value)
                  }}
                  defaultValue={title}
                />
              </Box>
            </Label>
            <Label sx={{ display: "block", mb: [5] }}>
              <Box sx={{ fontWeight: "700", mb: [1] }}>Instructions</Box>
              <Box sx={{ fontSize: "0.92em", fontStyle: "italic" }}>
                Explain to users that they’re participating in a collaborative survey, and suggest
                some questions you’d like them to address or answer.
                {prefillOptions[prefillSelection].prefill && (
                  <React.Fragment>
                    {" "}
                    <Text
                      sx={{ display: "inline", color: "primary", cursor: "pointer" }}
                      onClick={() => setShowExample(!showExample)}
                    >
                      {showExample ? "Hide example" : "Show example"}
                    </Text>{" "}
                    {showExample && (
                      <Box
                        sx={{
                          border: "1px solid",
                          borderRadius: "6px",
                          borderColor: "text",
                          px: "20px",
                          py: [3],
                          mt: [2],
                          mb: [3],
                          lineHeight: 1.4,
                        }}
                      >
                        <Box>{prefillOptions[prefillSelection].prefillIntro}</Box>
                        {prefillOptions[prefillSelection].prefill && (
                          <ul sx={{ mt: [1], mb: [2], pl: [3] }}>
                            {prefillOptions[prefillSelection].prefill
                              .concat(prefillOptions[prefillSelection].prefillExtra)
                              .split("?")
                              .map((item, index) => {
                                if (item === "") return
                                return <li key={index}>{item}?</li>
                              })}
                          </ul>
                        )}
                        <Box>You can vote on answers by other members, or add your own.</Box>
                        <Box sx={{ mt: [1] }}>
                          <Text
                            sx={{ display: "inline", color: "primary", cursor: "pointer" }}
                            onClick={() => {
                              if (!confirm("Overwrite your existing description?")) return
                              const desc =
                                prefillOptions[prefillSelection].prefillIntro +
                                "\n\n" +
                                prefillOptions[prefillSelection].prefill
                                  .concat(prefillOptions[prefillSelection].prefillExtra)
                                  .split("?")
                                  .map((item, index) => (item ? `- ${item.trim()}?` : ""))
                                  .join("\n") +
                                "\n" +
                                "You can vote on answers by other members, or add your own."
                              if (descriptionRef.current)
                                (descriptionRef.current as any).value = desc
                              setDescription(desc)
                              setShowExample(false)
                            }}
                          >
                            Use this example
                          </Text>
                        </Box>
                      </Box>
                    )}
                  </React.Fragment>
                )}
              </Box>
              <Box>
                <Textarea
                  ref={descriptionRef}
                  placeholder="Markdown supported"
                  rows={8}
                  onChange={(i) => {
                    setDescription(i.target.value)
                  }}
                  defaultValue={description}
                ></Textarea>
              </Box>
            </Label>
            <Button
              variant="primary"
              onClick={() => {
                dispatch(handleCreateConversationSubmit(title, description))
              }}
              disabled={!user}
              sx={
                user?.email || user?.githubUserId || user?.xInfo
                  ? {}
                  : { opacity: 0.4, pointerEvents: "none" }
              }
            >
              {user?.email || user?.githubUserId || user?.xInfo
                ? "Create this conversation"
                : "Log in to create conversations"}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default connector(CreateConversation)
