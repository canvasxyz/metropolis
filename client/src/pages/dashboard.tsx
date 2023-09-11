/** @jsx jsx */

import React, { useEffect } from "react"
import { Link as RouterLink } from "react-router-dom"
import { Heading, Box, Grid, Flex, Text, Table, Button, Link, jsx } from "theme-ui"

const Dashboard: React.FC<{ user? }> = ({ user }) => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <Box sx={{ height: "calc(100vh - 7px)" }}>
      <style>{"body { border-top: 5px solid #0090ff; border-image: none; }"}</style>
      <Flex sx={{ display: "flex", height: "100%" }}>
        <Box sx={{ width: ["40%", null, "260px"], borderRight: "1px solid #ddd" }}>
          <Box sx={{ width: "100%", borderBottom: "1px solid #ddd", py: [3], px: [4] }}>
            <RouterLink to="/">
              <Text variant="links.a" sx={{ fontWeight: 500, display: "inline" }}>
                Metropolis
              </Text>
            </RouterLink>{" "}
            / FIPs
          </Box>
          <Box sx={{ px: [4], pt: [3] }}>
            <Box sx={{ mt: [2], pb: [1] }}>
              <Box sx={{ mb: [2] }}>▾ Open FIPs</Box>
              <Box sx={{ ml: [3] }}>
                <Box sx={{ fontWeight: "600" }}>FIP-0100</Box>
                <Box>FIP-0101</Box>
              </Box>
            </Box>
            <Box sx={{ mt: [2] }}>
              <Box sx={{ mb: [2] }}>▾ Closed FIPs</Box>
              <Box sx={{ ml: [3] }}>
                <Box>FIP-0102</Box>
                <Box>FIP-0103</Box>
              </Box>
            </Box>
          </Box>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ margin: "0 auto", pt: [6, 7], px: [4], maxWidth: "720px" }}>
            <Box sx={{ position: "absolute", top: [3], right: [3] }}>
              <Button variant="outline" sx={{ my: [1], px: [2], py: [1] }}>
                View analysis
              </Button>
            </Box>
            <Heading as="h2">FIP-0100: Example Improvement Proposal</Heading>
            <Box sx={{ my: [3], px: [3], py: [3], border: "1px solid #ddd" }}>
              <Box>Author: Steven</Box>
              <Box>Status: Draft</Box>
              <Box>
                Pull Request: <Link to="#">23 days ago</Link>
              </Box>
              <Box>
                Discussions: <Link to="#">0 comments</Link>
              </Box>
              <Box>Type: Technical Core</Box>
            </Box>
            <Box>
              <Box sx={{ fontWeight: "600" }}>Short Summary</Box>
              <p>This FIP brings us a step closer to...</p>
            </Box>
            <Box>
              <Box sx={{ fontWeight: "500" }}>Temperature Check</Box>
              <Box sx={{ my: [3], px: [3], py: [3], border: "1px solid #ddd" }}>
                Insert poll here
              </Box>
            </Box>
          </Box>
        </Box>
      </Flex>
    </Box>
  )
}

export default Dashboard
