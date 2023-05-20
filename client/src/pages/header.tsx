/** @jsx jsx */
import React, { Component } from "react"
import { Flex, Box, jsx } from "theme-ui"

import { Link } from "react-router-dom"
import Logomark from "./widgets/logomark"

const Header: React.FC<{ user? }> = ({ user }) => {
  return (
    <Box>
      <Flex
        sx={{
          margin: `0 auto`,
          width: "100%",
          pt: [5],
          pb: [6],
          justifyContent: "space-between",
          fontFamily: "monospace",
        }}
      >
        <Box sx={{ zIndex: 1000 }}>
          <Logomark style={{ marginRight: 10, position: "relative", top: 6 }} fill={"#62a6ef"} />
          <Link sx={{ variant: "links.nav" }} to={user ? "/conversations" : "/"}>
            Polis
          </Link>
        </Box>
        <Box sx={{ mt: [1], mr: [-4] }}>
          {user ? (
            <React.Fragment>
              <Link sx={{ variant: "links.nav" }} to={`/account`}>
                Account
              </Link>
              <Link sx={{ variant: "links.nav" }} to="/signout">
                Sign out
              </Link>
            </React.Fragment>
          ) : (
            <Link sx={{ variant: "links.nav" }} to="/signin">
              Sign in
            </Link>
          )}
        </Box>
      </Flex>
    </Box>
  )
}

export default Header
