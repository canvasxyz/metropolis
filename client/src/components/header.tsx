/** @jsx jsx */
import React, { Component } from "react"
import { Flex, Box, jsx } from "theme-ui"

import { Link } from "react-router-dom"
import Logomark from "./logomark"

const Header: React.FC<{ isLoggedIn; user?; inSurvey? }> = ({ isLoggedIn, user, inSurvey }) => {
  return (
    <Flex
      sx={{
        margin: `0 auto`,
        width: "100%",
        pt: [3, 5],
        pb: [3, 5],
        px: [4],
        mb: [5, 0],
        fontFamily: "monospace",
        borderBottom: ["1px solid lightGray", "none"],
        justifyContent: inSurvey ? "center" : "space-between",
      }}
    >
      <Box
        sx={{
          position: "relative",
          top: "-1px",
        }}
      >
        {inSurvey ? (
          <Link
            to={document.location.pathname}
            onClick={(e) => {
              e.preventDefault()
              history.pushState({}, "", document.location.pathname + "#intro")
              window.dispatchEvent(new Event("popstate"))
            }}
          >
            <Logomark style={{ position: "relative", top: 6 }} fill={"#62a6ef"} />
          </Link>
        ) : (
          <Logomark style={{ position: "relative", top: 6 }} fill={"#62a6ef"} />
        )}
        {!inSurvey && (
          <Link sx={{ variant: "links.nav", ml: "10px" }} to={isLoggedIn ? "/conversations" : "/"}>
            Polis+
          </Link>
        )}
      </Box>
      {!inSurvey && (
        <Box sx={{ mt: [1] }}>
          {isLoggedIn ? (
            <React.Fragment>
              <Link sx={{ variant: "links.nav", ml: [4] }} to={`/account`}>
                Account
              </Link>
              <Link sx={{ variant: "links.nav", ml: [4] }} to="/signout">
                Sign out
              </Link>
            </React.Fragment>
          ) : (
            <Link sx={{ variant: "links.nav" }} to="/signin">
              Sign in
            </Link>
          )}
        </Box>
      )}
    </Flex>
  )
}

export default Header
