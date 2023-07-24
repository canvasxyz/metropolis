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
          marginTop: "-21px",
        }}
      >
        {inSurvey ? (
          <Link
            to={document.location.pathname}
            onClick={(e) => {
              e.preventDefault()
              if (document.location.hash !== "") {
                history.pushState({}, "", document.location.pathname + "#intro")
                window.dispatchEvent(new Event("popstate"))
              }
            }}
          >
            <Logomark style={{ position: "relative", top: 14 }} />
          </Link>
        ) : (
          <Link to={isLoggedIn ? "/conversations" : "/"}>
            <Logomark style={{ position: "relative", top: 14 }} />
          </Link>
        )}
        {!inSurvey && (
          <Link sx={{ variant: "links.nav", ml: "9px" }} to={isLoggedIn ? "/conversations" : "/"}>
            Quest
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
            <React.Fragment>
              {/*
              <Link sx={{ variant: "links.nav", ml: [4] }} to="/about">
                About
              </Link>
               */}
              <Link sx={{ variant: "links.nav", ml: [4] }} to="/signin">
                Sign in
              </Link>
            </React.Fragment>
          )}
        </Box>
      )}
    </Flex>
  )
}

export default Header
