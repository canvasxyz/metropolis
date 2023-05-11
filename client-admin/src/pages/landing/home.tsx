import React from 'react'
import Layout from './lander-layout'
import { Heading, Box, Text, Link } from 'theme-ui'

const Index = () => {
  return (
    <Layout>
      <React.Fragment>
        <Heading as="h1" sx={{ my: [4, null, 5], fontSize: [6, null, 7] }}>
          Input Crowd, Output Meaning
        </Heading>
        <Heading
          as="h3"
          sx={{
            fontSize: [3, null, 4],
            lineHeight: 'body',
            mb: [4, null, 5]
          }}>
          Polis is a real-time system for gathering, analyzing and understanding
          what large groups of people think in their own words, enabled by
          advanced statistics and machine learning.
        </Heading>
        <Box sx={{ mb: [4, null, 5] }}>
          <Text>
            Polis has been used all over the world by governments, academics,
            independent media and citizens, and is completely open source.
          </Text>
        </Box>
        <Heading
          as="h3"
          sx={{ fontSize: [4], lineHeight: 'body', mb: [2, null, 3] }}>
          Get Started
        </Heading>
        <Box sx={{ mb: [4, null, 5] }}>
          <Link href="/createuser">Sign up</Link>
          {' or '}
          <Link href="/signin">Sign in</Link>
        </Box>
        <Heading
          as="h3"
          sx={{ fontSize: [4], lineHeight: 'body', my: [2, null, 3] }}>
          Contribute
        </Heading>
        <Box sx={{ mb: [4, null, 5] }}>
          Explore the code and join the developer community{' '}
          <Link target="_blank" href="https://github.com/compdemocracy/">
            on Github
          </Link>
        </Box>
      </React.Fragment>
    </Layout>
  )
}

export default Index
