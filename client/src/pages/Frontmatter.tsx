// eslint-disable-next-line no-use-before-define
import React from "react"
import { Box, Text, Link } from "theme-ui"
import { ZidMetadata } from "../util/types"

type FrontmatterProps = { zid_metadata: ZidMetadata }

const splitAuthors = (authorList) => {
  const result = authorList
    .replace(
      "<a list of the author's or authors' name(s) and/or username(s), or name(s) and email(s), e.g. (use with the parentheses or triangular brackets):",
      "",
    )
    .replace(/"/g, "")
    .split(/, | and /)
  if (result.length === 1) {
    return result[0].split(/ @/).map((i) => {
      return `${i.slice(1).indexOf("@") !== -1 ? "" : "@"}${i.replace(/^@/, "").trim()}`
    })
  }
  return result
}

export const Frontmatter = ({ zid_metadata: conversation }: FrontmatterProps) => {
  const fields = ["title", "status", "author", "discussions-to"]
  const valueFieldNames = ["github_pr_title", "fip_status", "fip_author", "fip_discussions_to"]
  const valueFieldNamesDisplay = {
    title: "PR",
    author: "Author",
    "discussions-to": "Discussion",
    status: "Status",
  }

  const valuesExist =
    valueFieldNames.filter((valueFieldName) => conversation[valueFieldName]).length > 0

  return valuesExist ? (
    <Box
      sx={{
        overflowX: "scroll",
        mt: [2],
        px: [2],
        pt: "10px",
        pb: "10px",
        lineHeight: 1.25,
        fontSize: "0.94em",
        border: "1px solid #ddd",
      }}
    >
      <table>
        <tbody className="border">
          {valueFieldNames.map(
            (valueFieldName, i) =>
              conversation[valueFieldName] && (
                <tr key={i}>
                  <td>
                    <Text sx={{ fontWeight: "700" }}>{valueFieldNamesDisplay[fields[i]]}</Text>
                  </td>
                  <td className="border">
                    {valueFieldName === "github_pr_title" ? (
                      conversation.github_pr_url !== null ? (
                        <Link
                          target="_blank"
                          rel="noopener noreferrer"
                          href={conversation.github_pr_url}
                        >
                          {conversation[valueFieldName]} (#{conversation.github_pr_id})
                        </Link>
                      ) : (
                        conversation[valueFieldName]
                      )
                    ) : valueFieldName === "fip_author" ? (
                      splitAuthors(conversation[valueFieldName]).map((author, i) => {
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
                            {i < splitAuthors(conversation[valueFieldName]).length - 1 ? ", " : ""}
                          </React.Fragment>
                        )
                      })
                    ) : valueFieldName === "fip_discussions_to" ? (
                      (() => {
                        const matches = conversation[valueFieldName].match(/\[.+\]\((.+)\)/)
                        const links =
                          matches && matches[1]
                            ? [matches[1]]
                            : conversation[valueFieldName].split(", ")

                        return links.map((link) => (
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
                      })()
                    ) : (
                      conversation[valueFieldName]
                    )}
                  </td>
                </tr>
              ),
          )}
        </tbody>
      </table>
    </Box>
  ) : null
}
