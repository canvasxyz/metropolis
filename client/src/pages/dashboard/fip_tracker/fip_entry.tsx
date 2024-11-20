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

  const fipBadges = []
  const fipAttributes = []
  if (showType && conversation.fip_type) {
    fipBadges.push(
      <Badge size="2" variant="outline" radius="full" style={{ 
        boxShadow: "inset 0 0 0 1px var(--accent-a5)"
      }}>
        {conversation.fip_type}
      </Badge>,
    )
  }
  if (showCategory && conversation.fip_category) {
    fipBadges.push(
      <Badge size="2" variant="outline" radius="full" style={{
        boxShadow: "inset 0 0 0 1px var(--accent-a5)"
      }}>
        {conversation.fip_category}
      </Badge>,
    )
  }
  if (showCreationDate) {
    fipAttributes.push(
      <Flex sx={{ display: "inline-block", alignItems: "center", gap: [1], whiteSpace: "nowrap" }}>
        <TbCalendar />
        <Text> {new Date(Date.parse(conversation.fip_created)).toLocaleDateString()}</Text>
      </Flex>,
    )
  }
  if (showAuthors) {
    fipAttributes.push(
      <Text sx={{ whiteSpace: "nowrap" }}>
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
        borderLeftWidth: "4px",
        // this uses the color palette defined by radix-ui
        borderColor: fipStatusInfo.color === "gray" ? `#ccc` : `var(--${fipStatusInfo.color}-10)`,
        padding: "3px 0 6px",
        background: "#fff",
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
          gridRowGap: "10px",
        }}
      >
        <Flex sx={{ flexDirection: "row", gap: [4], alignItems: "center" }}>
          {isOpen ? <TbCaretDown /> : <TbCaretRight />}
        </Flex>
        <Flex sx={{ flexDirection: "row", gap: [3], alignItems: "center" }}>
          <Text
            style={{
              fontWeight: "bold",
              display: "inline-block",
              width: "48px",
              flex: "0 0 auto",
              fontSize: "95%",
            }}
          >
            {conversation.fip_number ? String(conversation.fip_number).padStart(4, "0") : "Draft"}
          </Text>
          <Text style={{ flex: 1, lineHeight: 1.3, fontSize: "95%", fontWeight: 500 }}>
            {conversation.displayed_title || <Text sx={{ color: "#84817D" }}>Untitled</Text>}
          </Text>
          <Badge size="2" color={fipStatusInfo.color} variant="surface" radius="full">
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
            style={{
              fontSize: "84%",
              fontWeight: "500",
            }}
          >
            GitHub <TbArrowUpRight sx={{ position: "relative", top: "2px" }} />
          </Link>
        </Flex>
        <Box></Box>
        <Flex sx={{ flexDirection: "row", gap: [2], alignItems: "center", fontSize: "90%" }}>
          {fipBadges}
          {fipAttributes.map((attr, i) => (
            <Text key={i} style={{ fontSize: "94%", opacity: 0.7, whiteSpace: "nowrap" }}>
              {i >= 0 && (
                <Text
                  style={{
                    marginLeft: "2px",
                    marginRight: "9px",
                    top: "-1px",
                    position: "relative",
                    opacity: 0.5,
                  }}
                >
                  |
                </Text>
              )}
              {attr}
            </Text>
          ))}
          <Box sx={{ flexGrow: "1" }}></Box>
        </Flex>
        {isOpen && (
          <>
            <Box></Box>
            {/* display the simple summary if possible otherwise display the whole fip description */}
            <Box sx={{ mb: [3] }}>
              <h3 style={{ margin: "0 0 10px" }}>Authors</h3>
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

              <h3 style={{ margin: "15px 0 10px" }}>Simple Summary</h3>

              {simpleSummary || conversation.description}
            </Box>
          </>
        )}
      </Grid>
    </div>
  )
}
