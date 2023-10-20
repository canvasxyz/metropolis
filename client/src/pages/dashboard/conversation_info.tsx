/** @jsx jsx */
import { Heading, Box, Flex, Text, Button, jsx } from "theme-ui"
import remarkGfm from "remark-gfm"
import remarkFrontMatter from "remark-frontmatter"
import ReactMarkdown from "react-markdown"
import { Frontmatter } from "../Frontmatter"
import Survey from "../survey"
import { TbSettings } from "react-icons/tb"
import { Conversation, RootState } from "../../util/types"
import { useHistory } from "react-router-dom"
import { useSelector } from "react-redux"

type ConversationInfoProps = {
  selectedConversation: Conversation;
};

const ConversationInfo = ({selectedConversation}: ConversationInfoProps) => {
  const hist = useHistory()
  const { zid_metadata } = useSelector((state: RootState) => state.zid_metadata)

  return (
    <Box>
      <Box sx={{width: "100%", borderBottom: "1px solid #ddd" }}>
        {(zid_metadata.is_mod || zid_metadata.is_owner) && (
          <Button
            variant="outlineSecondary"
            sx={{ position: "absolute", top: [4], right: [4], alignItems: "center", display: "flex", gap:[1]
          }}
            onClick={() => hist.push(`/m/${zid_metadata.conversation_id}`)}
          >
            <Box><TbSettings/></Box>
            <Text>Edit</Text>
          </Button>
        )}
        <Flex sx={{ flexDirection: "column", gap: [2], margin: "0 auto", pt: [6, 7], px:[4], maxWidth: "720px"}}>
          <Heading as="h2">{selectedConversation.fip_title || selectedConversation.github_pr_title}</Heading>
          <Text>
            Pull request: #<a
              target="_blank"
              rel="noopener noreferrer"
              href={`https://github.com/filecoin-project/FIPs/pull/${selectedConversation.github_pr_id}`}
            >{selectedConversation.github_pr_id}</a>
          </Text>
          <Frontmatter conversation={selectedConversation} />
          <Box>
            <ReactMarkdown
              skipHtml={true}
              remarkPlugins={[remarkGfm, [remarkFrontMatter, {type: "yaml", marker: "-"}]]}
              linkTarget="_blank"
            >
              {selectedConversation.description}
            </ReactMarkdown>
          </Box>
        </Flex>
      </Box>
      <Box sx={{width: "100%", position: "relative"}}>
        <Box sx={{ position: "absolute", top: [4], right: [4], px: [2], pt: "4px", pb: "3px", display:"flex", flex:"1", flexDirection: "row", gap:[2] }}>
        {(zid_metadata.is_mod || zid_metadata.is_owner) && (
        <Button
          variant="outlineSecondary"
          onClick={() => hist.push(`/m/${zid_metadata.conversation_id}/comments`)}
        >
          Moderate
        </Button>
        )}
        {(zid_metadata.is_mod || zid_metadata.is_owner) && (
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
          maxWidth: "720px",
          px: [4],
          py: [2],
          lineHeight: 1.45,
        }}
      >
        <Text sx={{
          color: "primary", textTransform: "uppercase", fontFamily: "heading",
          fontWeight: 400
        }}>
        Community Response
        </Text>
        <Survey match={{params: {conversation_id: selectedConversation.conversation_id}}}/>
      </Box>
      </Box>
    </Box>
  )
}

export default ConversationInfo
