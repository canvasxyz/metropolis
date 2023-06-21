import React from "react"
import { Box } from "theme-ui"

const SurveyFloatingPromptBox = ({
  zid_metadata,
  votedComments,
  unvotedComments,
  submittedComments,
}) => {
  const votesExpected = Math.min(
    zid_metadata.postsurvey_limit,
    unvotedComments.length + votedComments.length
  )
  const votes = votedComments.length
  const votesLeft = Math.max(votesExpected - votes, 0)

  const submissionsExpected = zid_metadata.postsurvey_submissions
  const submissions = submittedComments.length
  const submissionsLeft = Math.max(submissionsExpected - submissions, 0)

  const allDone = votesLeft === 0 && submissionsLeft === 0

  return (
    <React.Fragment>
      {(zid_metadata.postsurvey_limit || zid_metadata.postsurvey_submissions) && !allDone && (
        <Box
          sx={{
            border: "1px solid",
            borderColor: "#ddd",
            borderRadius: "4px",
            opacity: 0.9,
            position: "fixed",
            top: [4],
            right: [4],
            px: [3],
            py: [3],
            maxWidth: "232px",
            fontSize: "94%",
            textAlign: "center",
          }}
        >
          {!allDone && zid_metadata.postsurvey_limit && (
            <Box>
              {votesLeft} more to vote on
              <Box
                sx={{
                  my: [2],
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
                <Box sx={{ lineHeight: 1.35 }}>
                  {submittedComments.length === 0
                    ? "Try submitting a few statements too"
                    : `${submissionsLeft} more to submit`}
                </Box>
                <Box
                  sx={{
                    my: [2],
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
