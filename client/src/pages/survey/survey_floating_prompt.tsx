import React from "react"
import { Box, Button } from "theme-ui"

const SurveyFloatingPromptBox = ({
  state,
  zid_metadata,
  votedComments,
  unvotedComments,
  submittedComments,
  goTo,
}) => {
  const votesExpected = Math.min(
    zid_metadata.postsurvey_limit,
    unvotedComments.length + votedComments.length
  )
  const votes = votedComments.length - submittedComments.length
  const votesLeft = Math.max(votesExpected - votes, 0)

  const submissionsExpected = zid_metadata.postsurvey_submissions
  const submissions = submittedComments.length
  const submissionsLeft = Math.max(submissionsExpected - submissions, 0)

  const allDone = votesLeft === 0 && submissionsLeft === 0

  return (
    <React.Fragment>
      {state === "voting" &&
        (zid_metadata.postsurvey_limit || zid_metadata.postsurvey_submissions) &&
        (!allDone || document.location.hash === "postsurvey") && (
          <Box
            sx={{
              zIndex: 9998,
              bg: "background",
              border: "1px solid",
              borderColor: "#ddd",
              borderRadius: "4px",
              opacity: 0.9,
              position: "fixed",
              top: [4],
              right: [4],
              px: [3],
              pt: [3],
              pb: [2],
              maxWidth: "232px",
              fontSize: "94%",
              textAlign: "center",
            }}
          >
            {allDone && (
              <React.Fragment>
                <Box sx={{ mb: [3] }}>
                  You’ve finished the minimum requirements - you can exit the survey any time now
                </Box>
                <Button onClick={() => goTo("postsurvey")}>Finish up</Button>
              </React.Fragment>
            )}
            {!allDone && zid_metadata.postsurvey_limit && (
              <Box>
                <Box sx={{ lineHeight: 1.3 }}>
                  Vote on {votesLeft} more statement{votesLeft === 1 ? "" : "s"} to continue:
                </Box>
                <Box
                  sx={{
                    my: [3],
                    position: "relative",
                    height: "8px",
                    width: "200px",
                    borderRadius: "9999px",
                    bg: "lighterGray",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      width: `${Math.round(Math.min(1, votes / votesExpected) * 100)}%`,
                      height: "8px",
                      borderRadius: "9999px",
                      bg: "primary",
                    }}
                  ></Box>
                </Box>
              </Box>
            )}
            {!allDone &&
              zid_metadata.postsurvey_submissions &&
              (!zid_metadata.postsurvey_limit || votesLeft === 0) && (
                <Box sx={{ mt: [4], mb: [2] }}>
                  <Box sx={{ lineHeight: 1.3 }}>
                    {submittedComments.length === 0
                      ? "Try submitting a few statements too"
                      : `Try submitting ${submissionsLeft} more statement${
                          submissionsLeft === 1 ? "" : "s"
                        }:`}
                  </Box>
                  <Box
                    sx={{
                      my: [3],
                      position: "relative",
                      height: "8px",
                      width: "200px",
                      borderRadius: "9999px",
                      bg: "lighterGray",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        width: `${Math.round(
                          Math.min(
                            1,
                            Math.min(submissions, submissionsExpected) / submissionsExpected
                          ) * 100
                        )}%`,
                        height: "8px",
                        borderRadius: "9999px",
                        bg: "primary",
                      }}
                    ></Box>
                  </Box>
                </Box>
              )}
          </Box>
        )}
    </React.Fragment>
  )
}

export default SurveyFloatingPromptBox
