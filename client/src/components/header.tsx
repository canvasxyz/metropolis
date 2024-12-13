import React from "react"
import { Flex, Box, Link as RadixLink } from "@radix-ui/themes"

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
      <Flex
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
          <Flex gap="1" align="center">
            <Link to="/">
              <img
                src="/foundation.png"
                width="20"
                style={{ position: "relative", top: 3, opacity: 0.81 }}
              />
            </Link>
            <RadixLink size="3" weight="medium" asChild>
              <Link to="/">
                Fil Poll
              </Link>
            </RadixLink>
          </Flex>
        )}

      </Flex>
      {!inSurvey && (
        <Box mt="1">
          {isLoggedIn ? (
            <Flex gap="2">
              <RadixLink asChild>
                <Link to={`/account`}>
                  Account
                </Link>
              </RadixLink>
              <RadixLink asChild>
                <Link to="/signout">
                  Sign out
                </Link>
              </RadixLink>
            </Flex>
          ) : (
            <Flex gap="2">
              {/*
              <Link to="/about">
                About
              </Link>
               */}
              <RadixLink asChild>
                <Link to="/">
                  Back home
                </Link>
              </RadixLink>
            </Flex>
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
