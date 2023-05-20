/** @jsx jsx */
import { Component } from "react"
import { Box, Link, Heading, jsx } from "theme-ui"

class Header extends Component {
  render() {
    return (
      <Box sx={{ mt: [3, null, 4], mb: [2, null, 3], fontFamily: "monospace" }}>
        (c) {new Date().getFullYear()} Authors
        <Link sx={{ ml: 4 }} href="tos">
          TOS
        </Link>{" "}
        <Link sx={{ ml: 3 }} href="privacy">
          Privacy
        </Link>
      </Box>
    )
  }
}

export default Header
