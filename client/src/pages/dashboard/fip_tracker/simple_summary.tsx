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

type SimpleSummaryProps = {
  content: string
}

const SimpleSummary = ({ content }: SimpleSummaryProps) => {

  const [hasSimpleSummary, simpleSummaryText] = useMemo(() => {
    const extractedData = extractParagraphByTitle(content, "Simple Summary")
    if(extractedData)  {
      return [true, extractedData]
    } else {
      return [false, content]
    }
  }, [content])

  const [hasSummary, summaryText] = useMemo(() => {
    const extractedData = extractParagraphByTitle(content, "Summary")
    if(extractedData)  {
      return [true, extractedData]
    } else {
      return [false, content]
    }
  }, [content])

  if (hasSimpleSummary) {
    return <React.Fragment>
      <h3 style={{ margin: "15px 0 10px" }}>Simple Summary</h3>
      <ReactMarkdown
        skipHtml={true}
        remarkPlugins={[remarkGfm]}
        linkTarget="_blank"
        className="react-markdown"
      >
        {simpleSummaryText}
      </ReactMarkdown>
    </React.Fragment>
  } else if (hasSummary) {
    return <React.Fragment>
      <h3 style={{ margin: "15px 0 10px" }}>Summary</h3>
      <ReactMarkdown
        skipHtml={true}
        remarkPlugins={[remarkGfm]}
        linkTarget="_blank"
        className="react-markdown"
      >
        {summaryText}
      </ReactMarkdown>
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
