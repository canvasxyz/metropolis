import React from 'react'
import { connect } from 'react-redux'
import { Box, Heading, Button, Text } from 'theme-ui'

function ConversationParticipation() {
  return (
    <Box>
      <Heading
        as="h3"
        sx={{
          fontSize: [3, null, 4],
          lineHeight: 'body',
          mb: [3, null, 4]
        }}>
        This Conversation
      </Heading>
      <Box sx={{ mb: [3, null, 4] }}>
        <Button onClick={() => {}}>
          Add new card
        </Button>
      </Box>
      <Text sx={{ mb: 3 }}>0 remainining</Text>
      <Box sx={{
        display: "inline-block",
        border: "1px solid #ddd",
        width: 400,
        p: [20],
        mb: [3, null, 4]
      }}>
        <Text sx={{ mb: 4 }}>
          Hello, this is a sample card
        </Text>
        <Button sx={{ mr: 2 }} onClick={() => {}}>
          Agree
        </Button>
        <Button sx={{ mr: 2 }} onClick={() => {}}>
          Disagree
        </Button>
        <Button sx={{ mr: 2 }} onClick={() => {}}>
          Skip
        </Button>
      </Box>
    </Box>);
}

export default ConversationParticipation;
