import React, { useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import markdown from "remark-parse"
import { remark } from "remark"
import { unified } from "unified"

export const extractParagraphByTitle = (markdownText, title) => {
  const tree = unified().use(markdown).parse(markdownText)

  let titleDepth: number | null = null
  let foundHeading = false
  const extractedNodes: typeof tree.children = []

  for(const node of tree.children) {
    // is "value" the right property to check for the title?
    if (node.type === "heading" && node.children[0].value === title) {
      titleDepth = node.depth
      foundHeading = true
    } else if (foundHeading) {
      if (node.type === "heading" && node.depth <= titleDepth) {
        // Stop if an equally or more important heading is found
        break
      }
      extractedNodes.push(node)
    }
  }

  return extractedNodes.map(node => remark().stringify(node)).join("\n")
}

type SimpleSummaryProps = {
  content: string
}

const SimpleSummary = ({ content }: SimpleSummaryProps) => {
  const simpleSummaryText = useMemo(() => {
    return extractParagraphByTitle(content, "Simple Summary") || content
  }, [content])

  return <ReactMarkdown
    skipHtml={true}
    remarkPlugins={[remarkGfm]}
    linkTarget="_blank"
    className="react-markdown"
  >
    {simpleSummaryText}
  </ReactMarkdown>
}

export default SimpleSummary
