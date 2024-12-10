import React from "react"
import { Flex, Box } from "@radix-ui/themes"

import { Link } from "react-router-dom"

const Header = ({ isLoggedIn, inSurvey }: { isLoggedIn; inSurvey? }) => {
  return (
    <Flex
      m="0 auto"
      width="100%"
      pt={{ initial: "3", md: "5" }}
      pb={{ initial: "3", md: "5" }}
      px={{ initial: "4", md: "5" }}
      mb={{ initial: "5", md: "0" }}
      justify={inSurvey ? "center" : "between"}
    >
      <Box
        position="relative"
        mt="3px"
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
          <Link to="/">
            <img
              src="/foundation.png"
              width="20"
              style={{ position: "relative", top: 3, opacity: 0.81 }}
            />
          </Link>
        )}
        {!inSurvey && (
          <Link to="/">
            Fil Poll
          </Link>
        )}
      </Box>
      {!inSurvey && (
        <Box mt="1">
          {isLoggedIn ? (
            <React.Fragment>
              <Link to={`/account`}>
                Account
              </Link>
              <Link to="/signout">
                Sign out
              </Link>
            </React.Fragment>
          ) : (
            <React.Fragment>
              {/*
              <Link to="/about">
                About
              </Link>
               */}
              <Link to="/">
                Back home
              </Link>
            </React.Fragment>
          )}
        </Box>
      )}
      {/* only display lower border on small screens */}
      <Box
        display={{ initial: "block", sm: "none" }}
        style={{
          borderBottom: "1px solid lightGray",
        }}></Box>
    </Flex>
  )
}

export default Header
