import React from 'react'
import Layout from './lander-layout'
import { Heading, Box, Text, Link } from 'theme-ui'

const Index = () => {
  return (
    <Layout>
      <React.Fragment>
        <Heading
          as="h1"
          sx={{
            fontSize: [3, null, 5],
            lineHeight: 1.3,
            mt: [4],
            mb: [4]
          }}>
            A tool for collaborative intelligence
        </Heading>
        <Box sx={{ mb: [4, null, 5] }}>
          <Text sx={{ my: 3 }}>
            Polis is a tool for gathering, analyzing, and
            understanding what groups of people think.
          </Text>
          <Text sx={{ my: 3 }}>
            Starting from a prompt, groups contribute and vote on cards that map
            out the opinion space around a topic.
          </Text>
          <Text sx={{ my: 3 }}>
            The tool is open-source, and based on Polis, a tool used by
            governments, academics, and citizens around the world.
          </Text>
          <Box sx={{ mt: [4, null, 4] }}>
            <Link href="/createuser">Sign up</Link>
            {' or '}
            <Link href="/signin">Sign in</Link>
          </Box>
        </Box>
      </React.Fragment>
    </Layout>
  )
}

export default Index
