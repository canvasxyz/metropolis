// eslint-disable-next-line no-use-before-define
import React from "react"
import { Box, Text, Link } from "theme-ui"
import { Conversation } from "../util/types"

type FrontmatterProps = { conversation: Conversation }

export const Frontmatter = ({ conversation }: FrontmatterProps) => {
  const fields = ["title", "author", "discussions-to", "status", "type", "created"]
  const valueFieldNames = [
    "fip_title",
    "fip_author",
    "fip_discussions_to",
    "fip_status",
    "fip_type",
    "fip_created",
  ]
  const valueFieldNamesDisplay = {
    title: "Title",
    author: "Author",
    "discussions-to": "Discussion",
    status: "Status",
    type: "Type",
    created: "Created",
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
                    {valueFieldName === "fip_title" ? (
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
                    ) : valueFieldName === "fip_discussions_to" ? (
                      <Link
                        href={conversation[valueFieldName]}
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
                        {conversation[valueFieldName]}
                      </Link>
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
