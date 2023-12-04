/** @jsx jsx */

import { Heading, Box, Flex, Text, Button, jsx } from "theme-ui"
import { useHistory } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { TbSettings } from "react-icons/tb"

import { Frontmatter } from "../Frontmatter"
import Survey from "../survey"

export const DashboardConversation = ({ conversation, zid_metadata }) => {
  const hist = useHistory()

  return (
    <Box>
      <Box sx={{ width: "100%" }}>
        {zid_metadata.is_owner && (
          <Button
            variant="outlineSecondary"
            sx={{
              position: "absolute",
              top: [4],
              right: [4],
              alignItems: "center",
              display: "flex",
              gap: [1],
            }}
            onClick={() => hist.push(`/m/${zid_metadata.conversation_id}`)}
          >
            <Box>
              <TbSettings />
            </Box>
            <Text>Edit</Text>
          </Button>
        )}
        <Flex
          sx={{
            flexDirection: "column",
            gap: [2],
            margin: "0 auto",
            pt: [7],
            pb: [6],
            px: [4],
            maxWidth: "620px",
          }}
        >
          <Heading as="h2">
            {conversation.fip_title || conversation.github_pr_title || conversation.topic}
          </Heading>
          <Frontmatter conversation={conversation} />
          <Box>
            <ReactMarkdown skipHtml={true} remarkPlugins={[remarkGfm]} linkTarget="_blank">
              {conversation.description}
            </ReactMarkdown>
          </Box>
        </Flex>
      </Box>
      <Box sx={{ width: "100%", borderBottom: "1px solid #ddd" }}></Box>
      <Box sx={{ width: "100%", position: "relative" }}>
        <Box
          sx={{
            position: "absolute",
            top: [4],
            right: [4],
            px: [2],
            pt: "4px",
            pb: "3px",
            display: "flex",
            flex: "1",
            flexDirection: "row",
            gap: [2],
          }}
        >
          {zid_metadata.is_owner && (
            <Button
              variant="outlineSecondary"
              onClick={() => hist.push(`/m/${zid_metadata.conversation_id}/comments`)}
            >
              Moderate
            </Button>
          )}
          {console.log(zid_metadata)}
          {zid_metadata.is_owner && (
            <Button
              variant="outlineSecondary"
              onClick={() => hist.push(`/m/${zid_metadata.conversation_id}/report`)}
            >
              Results
            </Button>
          )}
        </Box>
        <Box
          sx={{
            margin: "0 auto",
            maxWidth: "620px",
            px: [4],
            py: [2],
            lineHeight: 1.45,
          }}
        >
          <h2>Tell us what you think</h2>
          <Text as="p" sx={{ mb: [3], pb: [1] }}>
            Vote on remarks on this FIP by other community members, or add your own:
          </Text>
          <Survey
            match={{
              params: { conversation_id: conversation.conversation_id },
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}
