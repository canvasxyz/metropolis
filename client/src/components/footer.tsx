/** @jsx jsx */
import { Component } from "react"
import { Box, Link, Heading, jsx } from "theme-ui"

class Header extends Component {
  render() {
    return (
      <Box sx={{ fontFamily: "monospace" }}>
        (c) {new Date().getFullYear()} Authors
        <Link sx={{ ml: 4 }} href="/tos">
          Terms
        </Link>{" "}
        <Link sx={{ ml: 3 }} href="/privacy">
          Privacy
        </Link>
      </Box>
    )
  }
}

export default Header
