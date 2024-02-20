// eslint-disable-next-line no-use-before-define
import React, { useState } from "react"
import { Button, Box, Text, Link } from "theme-ui"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { ZidMetadata } from "../../util/types"

type FrontmatterProps = { zid_metadata: ZidMetadata }

const splitAuthors = (authorList = "") => {
  const result = authorList
    ?.replace(
      "<a list of the author's or authors' name(s) and/or username(s), or name(s) and email(s), e.g. (use with the parentheses or triangular brackets):",
      "",
    )
    .replace(/"/g, "")
    .split(/, | and /)
  if (result && result.length === 1) {
    return result[0].split(/ @/).map((i) => {
      return `${i.slice(1).indexOf("@") !== -1 ? "" : "@"}${i.replace(/^@/, "").trim()}`
    })
  }
  return result
}

export const Collapsible = ({
  title,
  content,
  shouldCollapse,
}: {
  title: string
  content: string
  shouldCollapse: boolean
}) => {
  const [collapsed, setCollapsed] = useState(shouldCollapse)

  return (
    <Box sx={{ mb: [1] }}>
      <Box
        className={collapsed ? "react-markdown css-fade" : "react-markdown"}
        sx={
          collapsed
            ? {
                wordBreak: "break-word",
                maxHeight: "80px",
                overflow: "hidden",
              }
            : { wordBreak: "break-word", maxHeight: "300px", overflow: "scroll", mb: [1] }
        }
      >
        <ReactMarkdown skipHtml={true} remarkPlugins={[remarkGfm]} linkTarget="_blank">
          {collapsed && title
            ? content.replace(/\#+ .+/, "").replace(/\#+\ +Simple Summary/i, "")
            : content}
        </ReactMarkdown>
      </Box>
      {shouldCollapse && (
        <Link
          href="#"
          onClick={(e: any) => {
            e.target.previousElementSibling.scrollTop = 0
            setCollapsed(!collapsed)
          }}
          variant="links.primary"
        >
          {collapsed ? "Show more" : "Show less"}
        </Link>
      )}
    </Box>
  )
}

export const Frontmatter = ({ zid_metadata: conversation }: FrontmatterProps) => {
  const matches = conversation["fip_discussions_to"]?.match(/\[.+\]\((.+)\)/)
  const links =
    matches && matches[1] ? [matches[1]] : conversation["fip_discussions_to"]?.split(", ")
  const discussions = (links || []).map((link) => (
    <Link
      key={link}
      href={link}
      target="_blank"
      noreferrer="noreferrer"
      noopener="noopener"
      sx={{
        display: "block",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        overflow: "hidden",
        width: "calc(100% - 20px)",
      }}
    >
      {link}
    </Link>
  ))

  return (
    <table>
      <tbody className="border">
        {(conversation.github_pr_url || conversation.github_pr_title) && (
          <tr>
            <td>
              <Text sx={{ fontWeight: "700" }}>PR</Text>
            </td>
            <td>
              {conversation.github_pr_url !== null ? (
                <Link target="_blank" rel="noopener noreferrer" href={conversation.github_pr_url}>
                  {conversation.github_pr_title} (#{conversation.github_pr_id})
                </Link>
              ) : (
                conversation.github_pr_title
              )}
            </td>
          </tr>
        )}
        {discussions && discussions.length > 0 && (
          <tr>
            <td>
              <Text sx={{ fontWeight: "700" }}>Discussion</Text>
            </td>
            <td>{discussions}</td>
          </tr>
        )}
        {conversation.fip_author && (
          <tr>
            <td>
              <Text sx={{ fontWeight: "700" }}>Author</Text>
            </td>
            <td>
              {splitAuthors(conversation.fip_author)?.map((author, i) => {
                const matches = author.match(/.*@(\w+)/)
                if (!matches) return author
                const username = matches[1]
                return (
                  <React.Fragment key={author}>
                    <Link
                      href={`https://github.com/${username}`}
                      target="_blank"
                      noreferrer="noreferrer"
                      noopener="noopener"
                    >
                      {author}
                    </Link>
                    {i < splitAuthors(conversation.fip_author).length - 1 ? ", " : ""}
                  </React.Fragment>
                )
              })}
            </td>
          </tr>
        )}
        <tr>
          {conversation.fip_author && (
            <td>
              <Text sx={{ fontWeight: "700" }}>Text</Text>
            </td>
          )}
          <td>
            {conversation.description && (
              <Collapsible
                title={conversation.fip_title}
                key={conversation.conversation_id}
                shouldCollapse={conversation.description?.length > 300}
                content={conversation.description}
              ></Collapsible>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  )
}
