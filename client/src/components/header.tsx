/** @jsx jsx */
import React, { Component } from "react"
import { Flex, Box, jsx } from "theme-ui"

import { Link } from "react-router-dom"

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
          marginTop: "3px",
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
            <img
              src="/foundation.png"
              width="20"
              style={{ position: "relative", top: 3, opacity: 0.81 }}
            />
          </Link>
        ) : (
          <Link to={isLoggedIn ? "/conversations" : "/"}>
            <img
              src="/foundation.png"
              width="20"
              style={{ position: "relative", top: 3, opacity: 0.81 }}
            />
          </Link>
        )}
        {!inSurvey && (
          <Link
            sx={{ variant: "links.nav", ml: "9px", fontWeight: "500" }}
            to={isLoggedIn ? "/conversations" : "/"}
          >
            Metropolis
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
