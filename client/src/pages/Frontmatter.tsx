// eslint-disable-next-line no-use-before-define
import React from "react"
import { Box, Text, Link } from "theme-ui"
import { Conversation } from "../util/types"

type FrontmatterProps = { conversation: Conversation }

export const Frontmatter = ({ conversation }: FrontmatterProps) => {
  const fields = [
    "status",
    // "title",
    "author",
    "discussions-to",
    //"type",
    //"created"
  ]
  const valueFieldNames = [
    "fip_status",
    // "fip_title",
    "fip_author",
    "fip_discussions_to",
    //"fip_type",
    //"fip_created",
  ]
  const valueFieldNamesDisplay = {
    // title: "Title",
    author: "Author",
    "discussions-to": "Discussion",
    status: "Status",
    // type: "Type",
    // created: "Created",
  }

  const valuesExist =
    valueFieldNames.filter((valueFieldName) => conversation[valueFieldName]).length > 0

  return valuesExist ? (
    <Box sx={{ overflowX: "scroll", mt: [3], px: [3], py: [3], border: "1px solid #ddd" }}>
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
                    {valueFieldName === "fip_status" ? (
                      conversation.github_pr_url !== null ? (
                        <Link
                          target="_blank"
                          rel="noopener noreferrer"
                          href={conversation.github_pr_url}
                        >
                          {conversation[valueFieldName]}
                        </Link>
                      ) : (
                        conversation[valueFieldName]
                      )
                    ) : valueFieldName === "fip_author" ? (
                      conversation[valueFieldName]
                        .replace(
                          "<a list of the author's or authors' name(s) and/or username(s), or name(s) and email(s), e.g. (use with the parentheses or triangular brackets):",
                          "",
                        )
                        .replace(/"|'/g, "")
                        .split(", ")
                        .map((author) => {
                          const matches = author.match(/.*@(\w+)/)
                          if (!matches) return author
                          const username = matches[1]
                          return (
                            <>
                              <Link
                                href={`https://github.com/${username}`}
                                target="_blank"
                                noreferrer="noreferrer"
                                noopener="noopener"
                              >
                                {author}
                              </Link>
                              <br />
                            </>
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
