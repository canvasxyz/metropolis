import React, { useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import markdown from "remark-parse"
import { remark } from "remark"
import { unified } from "unified"
import { Box } from "@radix-ui/themes"

export const extractParagraphByTitle = (markdownText, title) => {
  const tree = unified().use(markdown).parse(markdownText)

  let titleDepth: number | null = null
  let foundHeading = false
  const extractedNodes: typeof tree.children = []

  for(const node of tree.children) {
    if(foundHeading) {
      if (node.type === "heading" && node.depth <= titleDepth) {
        // Stop if an equally or more important heading is found
        break
      }
      extractedNodes.push(node)
    } else {
      if (node.type === "heading") {
        let hasTitle = false
        const child = node.children[0]
        if (child.type === "text") {
          if(child.value === title) {
            hasTitle = true
          }
        } else if (child.type === "strong" || child.type === "emphasis" || child.type === "delete" ) {
          const grandChild = child.children[0]
          if(grandChild.type === "text" && grandChild.value === title) {
            hasTitle = true
          }
        }
        if (hasTitle) {
          foundHeading = true
          titleDepth = node.depth
        }
      }
    }
  }

  return extractedNodes.map(node => remark().stringify(node)).join("\n")
}

export const extractFirstSection = (markdownText) => {
  const tree = unified().use(markdown).parse(markdownText)

  let titleDepth: number | null = null
  let foundHeading = false
  const extractedNodes: typeof tree.children = []

  for(const node of tree.children) {
    if(foundHeading) {
      if (node.type === "heading" && node.depth <= titleDepth) {
        // Stop if an equally or more important heading is found
        break
      }
      extractedNodes.push(node)
    } else {
      if (node.type === "heading") {
          foundHeading = true
          titleDepth = node.depth
      }
    }
  }

  return extractedNodes.map(node => remark().stringify(node)).join("\n")
}


type SimpleSummaryProps = {
  content: string
}

const SimpleSummary = ({ content }: SimpleSummaryProps) => {

  const extractedData = useMemo(() => {
    const simpleSummaryContent = extractParagraphByTitle(content, "Simple Summary")
    if (simpleSummaryContent)  {
      return { title: "Simple Summary", content: simpleSummaryContent }
    }

    const summaryContent = extractParagraphByTitle(content, "Summary")
    if (summaryContent)  {
      return { title: "Summary", content: summaryContent }
    }

    const firstSectionContent = extractFirstSection(content)
    if (firstSectionContent) {
      return { title: null, content: firstSectionContent }
    }

  }, [content])

  if (extractedData) {
    return <React.Fragment>
      {extractedData.title !== null && <h3>{extractedData.title}</h3>}
      <Box mt="2">
        <ReactMarkdown
          skipHtml={true}
          remarkPlugins={[remarkGfm]}
          linkTarget="_blank"
          className="react-markdown"
        >
          {extractedData.content}
        </ReactMarkdown>
      </Box>
    </React.Fragment>
  } else {
    return <React.Fragment>
      <ReactMarkdown
        skipHtml={true}
        remarkPlugins={[remarkGfm]}
        linkTarget="_blank"
        className="react-markdown"
      >
        {content}
      </ReactMarkdown>
    </React.Fragment>
  }
}

export default SimpleSummary
