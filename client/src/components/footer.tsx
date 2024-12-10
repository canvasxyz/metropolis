import React from "react"
import { Link } from "react-router-dom"
import { Flex, Text } from "@radix-ui/themes"

const Footer = ({ inSurvey }: { inSurvey: boolean }) => {
  return (
    <Flex
      align="center"
      px="4"
      gap="3"
      justify="center"
    >
      {!inSurvey && (
        <Text as="span" sx={{ mr: 3 }}>
          &copy; {new Date().getFullYear()} Authors
        </Text>
      )}
      <Link to="/tos">
        Terms
      </Link>{" "}
      <Link to="/privacy">
        Privacy
      </Link>
      {inSurvey && (
        <Link to="/">
          About
        </Link>
      )}
      {!inSurvey && (
        <Link to="/about">
          About
        </Link>
      )}
    </Flex>
  )
}

export default Footer
