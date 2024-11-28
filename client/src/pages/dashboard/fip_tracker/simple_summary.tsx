import React, { useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import markdown from "remark-parse"
import { remark } from "remark"
import { unified } from "unified"

export const extractParagraphByTitle = (markdownText, title) => {
  const tree = unified().use(markdown).parse(markdownText)

  let inDesiredSection = false
  let extractedParagraph: string | null = null

  function visitNode(node) {
    if (node.type === "heading" && node.children[0].value === title) {
      inDesiredSection = true
    } else if (inDesiredSection) {
      if (node.type === "paragraph" || node.type === "list") {
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
