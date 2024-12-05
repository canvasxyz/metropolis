import React from "react"

import { TbGitPullRequest } from "react-icons/tb"
import { BiSolidBarChartAlt2 } from "react-icons/bi"
import { Link as RouterLink, useHistory } from "react-router-dom"
import { Box, Card, Container, Flex, Grid, Separator, Text } from "@radix-ui/themes"

import { useAppSelector } from "../../hooks"
import { ConversationSummary } from "../../reducers/conversations_summary"
import { RootState } from "../../store"
import { formatTimeAgo, MIN_SEED_RESPONSES } from "../../util/misc"
import { getIconForConversation } from "./conversation_list_item"

const ConversationsPreview = ({ conversations }: { conversations: ConversationSummary[] }) => {
  const hist = useHistory()

  return (
    <Flex direction="column" gap="3">
      {conversations.length === 0 && (
        <Box mt="3" mb="3"><Text weight="bold">None found</Text></Box>
      )}
      {conversations.map((c) => {
        const date = new Date(c.fip_version?.fip_created || +c.created)
        const timeAgo = formatTimeAgo(+date)

        return (
          <Card key={c.created}>
            <Flex
              sx={{
                bg: "bgWhite",
                border: "1px solid #e2ddd599",
                borderRadius: "8px",
                px: [3],
                py: "12px",
                mb: [2],
                lineHeight: 1.3,
                cursor: "pointer",
                "&:hover": {
                  border: "1px solid #e2ddd5",
                },
              }}
              onClick={() => hist.push(`/dashboard/c/${c.conversation_id}`)}
            >
              <Box pr="13px" pt="1px">
                {c.fip_version?.github_pr?.title ? (
                  getIconForConversation(c)
                ) : (
                  <BiSolidBarChartAlt2 color="#0090ff" />
                )}
              </Box>
              <Box>
                <Box>
                  {c.fip_version?.github_pr?.title && <Text sx={{ fontWeight: 600 }}>FIP: </Text>}
                  {c.fip_version?.fip_title || c.fip_version?.github_pr?.title || c.topic}
                </Box>
                <Box mt="3px">
                  <Text size="2">
                    Created {timeAgo}
                  </Text>
                </Box>
              </Box>
            </Flex>
          </Card>
        )
      })}
    </Flex>
  )
}

export const LandingPage = () => {
  const { data } = useAppSelector((state: RootState) => state.conversations_summary)
  const conversations = data || []

  return (
    <Box>
      <Container size="3" mt="4">
        <Flex
          direction="column"
          align="center"
          justify="center"
          pt="8"
        >
          <img
            src="/filecoin.png"
            width="80px"
            height="80px"
          />
          <Box pb="3" pt="3">
            <Text size="6" weight="bold" >Welcome to Fil Poll</Text>
          </Box>
          <Text sx={{ }}>
            A nonbinding sentiment check tool for the Filecoin community.
          </Text>
        </Flex>
        <Grid columns="2" gap="4" py="6">
          {/* discussions */}
          <Card>
            <Flex direction="column" gap="3" mx="2" mt="3">
              <Flex>
                <Box sx={{ flex: "0 0 25px" }}>
                  <BiSolidBarChartAlt2 color="#0090ff" style={{ marginRight: "6px" }} />
                </Box>
                <Box>
                  <Text sx={{ fontWeight: 700 }}>
                    Initiate discussions, collect feedback, and respond to polls
                  </Text>{" "}
                  on open-ended thoughts or ideas.
                </Box>
              </Flex>
              <Separator size="4"/>

                The following discussion polls have been active recently:

              <ConversationsPreview
                conversations={conversations
                  .filter(
                    (c) =>
                      !c.is_archived &&
                      !c.is_hidden &&
                      !c.fip_version?.github_pr?.title &&
                      c.comment_count >= MIN_SEED_RESPONSES,
                  )
                  .slice(0, 5)}
              />
            </Flex>
          </Card>
          {/* FIPs */}
          <Card>
            <Flex direction="column" gap="3" mx="2" mt="3">
              <Flex>
                <Box sx={{ flex: "0 0 25px" }}>
                  <TbGitPullRequest color="#3fba50" style={{ marginRight: "6px" }} />
                </Box>
                <Box>
                  <Text sx={{ fontWeight: 700 }}>Signal your position</Text> on FIPs through sentiment
                  checks. <br />

                </Box>
              </Flex>
              <Separator size="4"/>
              The following FIPs are currently open for sentiment checks:
              <ConversationsPreview
                conversations={conversations
                  .filter((c) => !c.is_archived && !c.is_hidden && c.fip_version?.github_pr?.title && c.fip_version?.fip_files_created)
                  .slice(0, 5)}
              />
            </Flex>
          </Card>
        </Grid>
      </Container>
      {/* footer */}
      <Flex p="4" direction="row">
        <RouterLink to="/about">
          <Text weight="bold">About Fil Poll</Text>
        </RouterLink>
        <Box flexGrow="1"/>
        Fil Poll &copy; 2024
      </Flex>
    </Box>
  )
}
