// eslint-disable-next-line no-use-before-define
import React, { useState } from "react"
import { Box, Text, Link } from "theme-ui"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { ZidMetadata } from "../../util/types"
import { getGitHubPrUrl } from "../../util/github_pr"

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
                maxHeight: "140px",
                overflow: "hidden",
              }
            : {
                wordBreak: "break-word",
                maxHeight: "calc(100vh - 260px)",
                overflow: "scroll",
                mb: [1],
              }
        }
      >
        <ReactMarkdown skipHtml={true} remarkPlugins={[remarkGfm]} linkTarget="_blank">
          {collapsed && title
            ? content.replace(/#+ .+/, "").replace(/#+ +Simple Summary/i, "")
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

export const Frontmatter = ({ zid_metadata }: FrontmatterProps) => {
  const { fip_version } = zid_metadata
  const matches = fip_version.fip_discussions_to?.match(/\[.+\]\((.+)\)/)
  const links = matches && matches[1] ? [matches[1]] : fip_version.fip_discussions_to?.split(", ")
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
    <table style={{ tableLayout: "fixed", width: "100%" }}>
      <tbody className="border">
        {fip_version.github_pr && (
          <tr>
            <td width="110">
              <Text sx={{ fontWeight: "700" }}>PR</Text>
            </td>
            <td>
              <Link
                target="_blank"
                rel="noopener noreferrer"
                href={getGitHubPrUrl(fip_version.github_pr)}
              >
                {fip_version.github_pr.title} (#{fip_version.github_pr.id})
              </Link>
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
        {fip_version.fip_author && (
          <tr>
            <td>
              <Text sx={{ fontWeight: "700" }}>Author</Text>
            </td>
            <td>
              {splitAuthors(fip_version.fip_author)?.map((author, i) => {
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
                    {i < splitAuthors(fip_version.fip_author).length - 1 ? ", " : ""}
                  </React.Fragment>
                )
              })}
            </td>
          </tr>
        )}
        {!fip_version.fip_content &&
        !fip_version.fip_number &&
        !fip_version.fip_status &&
        !fip_version.fip_type ? (
          <React.Fragment>
            <tr>
              <td>
                <Text sx={{ fontWeight: "700" }}>Files Updated</Text>
              </td>
              <td>
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  href={getGitHubPrUrl(fip_version.github_pr)}
                >
                  {fip_version.fip_files_updated}
                </Link>
              </td>
            </tr>
            <td style={{ height: 3 }}></td>
          </React.Fragment>
        ) : (
          <tr>
            <td style={{ paddingTop: 8 }}>
              <Text sx={{ fontWeight: "700" }}>Text</Text>
            </td>
            <td style={{ display: "grid", paddingTop: 8 }}>
              {fip_version.fip_content ? (
                <Collapsible
                  title={fip_version.fip_title}
                  shouldCollapse={fip_version.fip_content?.length > 300}
                  content={fip_version.fip_content}
                ></Collapsible>
              ) : (
                <Box sx={{ pb: [1] }}>
                  Could not parse FIP text. Refer to the linked Github PR for more information.
                </Box>
              )}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
