import React, { useState } from "react"
import { TbArrowUpRight, TbCalendar, TbCaretDown, TbCaretRight } from "react-icons/tb"
import { Link } from "react-router-dom-v5-compat"
import markdown from "remark-parse"
import { remark } from "remark"
import { unified } from "unified"
import { Box, Flex, Grid } from "theme-ui"

import { ConversationSummary } from "../../../reducers/conversations_summary"
import { Badge, Text } from "@radix-ui/themes"
import { statusOptions } from "./status_options"

const extractParagraphByTitle = (markdownText, title) => {
  const tree = unified().use(markdown).parse(markdownText)

  let inDesiredSection = false
  let extractedParagraph = null

  function visitNode(node) {
    if (node.type === "heading" && node.children[0].value === title) {
      inDesiredSection = true
    } else if (inDesiredSection) {
      if (node.type === "paragraph") {
        extractedParagraph = remark().stringify(node)
        inDesiredSection = false // Stop after finding the first paragraph
      } else if (node.type === "heading" && node.depth <= 2) {
        inDesiredSection = false // Stop if another heading of depth 1 or 2 is found
      }
    }
  }

  tree.children.forEach(visitNode)

  return extractedParagraph
}

export const FipEntry = ({
  conversation,
  showAuthors,
  showCategory,
  showCreationDate,
  showType,
}: {
  conversation: ConversationSummary & { displayed_title: string; fip_authors: string[] }
  showAuthors: boolean
  showCategory: boolean
  showCreationDate: boolean
  showType: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const simpleSummary = extractParagraphByTitle(conversation.description, "Simple Summary")

  let fipStatusKey
  if (conversation.fip_status === "Last Call") {
    fipStatusKey = "last-call"
  } else if (conversation.fip_status === "WIP") {
    fipStatusKey = "draft"
  } else if (!conversation.fip_status) {
    fipStatusKey = "unknown"
  } else {
    fipStatusKey = conversation.fip_status.toLowerCase()
  }

  const fipStatusInfo = fipStatusKey ? statusOptions[fipStatusKey] : statusOptions.draft
  const fipStatusLabel = statusOptions[fipStatusKey].label

  const fipAttributes = []
  if (showType && conversation.fip_type) {
    fipAttributes.push(
      <Badge size="3" variant="outline">
        Type: {conversation.fip_type}
      </Badge>,
    )
  }
  if (showCategory && conversation.fip_category) {
    fipAttributes.push(
      <Badge size="3" variant="outline">
        Category: {conversation.fip_category}
      </Badge>,
    )
  }
  if (showCreationDate) {
    fipAttributes.push(
      <Flex sx={{ alignItems: "center", gap: [1] }}>
        <TbCalendar style={{ top: "0px", paddingRight: 0 }} />
        <Text>{new Date(Date.parse(conversation.fip_created)).toLocaleDateString()}</Text>
      </Flex>,
    )
  }
  if (showAuthors) {
    fipAttributes.push(
      <Text>
        {conversation.fip_authors.length} author{conversation.fip_authors.length > 1 ? "s" : ""}
      </Text>,
    )
  }

  return (
    <div
      style={{
        cursor: "pointer",
        borderRadius: "8px",
        borderStyle: "solid",
        borderWidth: "1px",
        // this uses the color palette defined by radix-ui
        borderColor: `var(--${fipStatusInfo.color}-10)`,
      }}
      key={conversation.conversation_id}
      onClick={() => setIsOpen(!isOpen)}
    >
      <Grid
        sx={{
          margin: "10px",
          gridTemplateColumns: "20px 1fr",
          gridRow: "auto auto",
          gridColumnGap: "20px",
          gridRowGap: "20px",
        }}
      >
        <Flex sx={{ flexDirection: "row", gap: [4], alignItems: "center" }}>
          {isOpen ? <TbCaretDown /> : <TbCaretRight />}
        </Flex>
        <Flex sx={{ flexDirection: "row", gap: [4], alignItems: "center" }}>
          <Text>{conversation.fip_number || "-"}</Text>
          <Text>
            {conversation.displayed_title || <Text sx={{ color: "#84817D" }}>Untitled</Text>}
          </Text>
          <Box sx={{ flexGrow: "1" }}></Box>
          <Badge size="3" color={fipStatusInfo.color} variant="surface">
            {fipStatusLabel}
          </Badge>
          <Link
            to={conversation.github_pr_url}
            target="_blank"
            noreferrer="noreferrer"
            noopener="noopener"
            onClick={(e) => e.stopPropagation()}
            sx={{
              display: "block",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              overflow: "hidden",
              width: "calc(100% - 20px)",
            }}
          >
            GitHub <TbArrowUpRight />
          </Link>
        </Flex>
        <Box></Box>
        <Flex sx={{ flexDirection: "row", gap: [2], alignItems: "center" }}>
          {fipAttributes.map((attr, i) => (
            <React.Fragment key={i}>
              {i > 0 && <Text>|</Text>}
              {attr}
            </React.Fragment>
          ))}
          <Box sx={{ flexGrow: "1" }}></Box>
        </Flex>
        {isOpen && (
          <>
            <Box></Box>
            {/* display the simple summary if possible otherwise display the whole fip description */}
            <Box>
              <h3>Authors</h3>
              {conversation.fip_authors.map((author, i) => {
                const matches = author.match(/.*@(\w+)/)
                if (!matches) return author
                const username = matches[1]
                return (
                  <React.Fragment key={author}>
                    <Link
                      onClick={(e) => e.stopPropagation()}
                      to={`https://github.com/${username}`}
                      target="_blank"
                      noreferrer="noreferrer"
                      noopener="noopener"
                    >
                      {author}
                    </Link>
                    {i < conversation.fip_authors.length - 1 ? ", " : ""}
                  </React.Fragment>
                )
              })}

              <h3>Simple Summary</h3>

              {simpleSummary || conversation.description}
            </Box>
          </>
        )}
      </Grid>
    </div>
  )
}
