import React from "react"

import { TbGitPullRequest } from "react-icons/tb"
import { BiSolidBarChartAlt2 } from "react-icons/bi"
import { Link as RouterLink, useHistory } from "react-router-dom"
import { Box, Container, Flex, Grid, Separator, Text } from "@radix-ui/themes"

import useSWR from "swr"
import { useAppSelector } from "../../hooks"
import { ConversationSummary } from "../../reducers/conversations_summary"
import { RootState } from "../../store"
import { formatTimeAgo, MIN_SEED_RESPONSES } from "../../util/misc"
import { getIconForConversation } from "./conversation_list_item"

const SectionCard = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      borderColor: "#E8E8EB",
      borderRadius: "16px",
      borderStyle: "solid",
      borderWidth: "1px",
      padding: "6px 12px 18px 12px",
      background: "#fff",
      fontSize: "95%",
    }}
  >
    {children}
  </div>
)

const ConversationCard = ({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) => (
  <div
    style={{
      borderColor: "#E8E8EB",
      borderRadius: "8px",
      borderStyle: "solid",
      borderWidth: "1px",
      padding: "8px",
      background: "#fff",
      fontSize: "95%",
    }}
    onClick={onClick}
  >
    {children}
  </div>
)

const ConversationsPreview = ({ conversations }: { conversations: ConversationSummary[] }) => {
  const hist = useHistory()

  return (
    <Flex direction="column" gap="3">
      {conversations.length === 0 && (
        <Box mt="3" mb="3">
          <Text weight="bold">None found</Text>
        </Box>
      )}
      {conversations.map((c) => {
        const date = new Date(c.fip_version?.fip_created || +c.created)
        const timeAgo = formatTimeAgo(+date)
        const fipVersion = c.fip_version

        return (
          <ConversationCard
            key={c.created}
            onClick={() => hist.push(`/dashboard/c/${c.conversation_id}`)}
          >
            <Flex gap="3">
              <Box>
                <Text size="2">
                  {fipVersion?.github_pr?.title ? (
                    getIconForConversation(c)
                  ) : (
                    <BiSolidBarChartAlt2 color="#0090ff" />
                  )}
                </Text>
              </Box>
              <Box>
                <Box>
                  {fipVersion ? (
                    <React.Fragment>
                      <Text weight="bold">
                        FIP
                        {fipVersion.fip_number
                          ? String(fipVersion.fip_number).padStart(4, "0")
                          : ""}
                        :{" "}
                      </Text>
                      {fipVersion.fip_title || fipVersion.github_pr?.title}
                    </React.Fragment>
                  ) : (
                    c.topic
                  )}
                </Box>
                <Box>
                  <Text size="2" color="gray">
                    Created {timeAgo}
                  </Text>
                </Box>
              </Box>
            </Flex>
          </ConversationCard>
        )
      })}
    </Flex>
  )
}

export const LandingPage = () => {
  const { data } = useSWR(
    `conversations_summary`,
    async () => {
      const response = await fetch(`/api/v3/conversations_summary`)
      return (await response.json()) as ConversationSummary[]
    },
    { keepPreviousData: true, focusThrottleInterval: 500 },
  )
  const conversations = data || []

  return (
    <Box>
      <Container size="3" mt="4" px="3">
        <Flex direction="column" align="center" justify="center" pt="8">
          <img src="/filecoin.png" width="80px" height="80px" />
          <Box pb="3" pt="3">
            <Text size="6" weight="bold">
              Welcome to Fil Poll
            </Text>
          </Box>
          A nonbinding sentiment check tool for the Filecoin community.
        </Flex>
        <Grid columns={{ initial: "1", md: "2" }} gap="4" py="6">
          {/* discussions */}
          <SectionCard>
            <Flex direction="column" gap="4" mx="2" mt="3">
              <Flex gap="3">
                <Box>
                  <Text size="2">
                    <BiSolidBarChartAlt2 color="#0090ff" />
                  </Text>
                </Box>
                <Box>
                  <Text weight="bold">
                    Initiate discussions, collect feedback, and respond to polls
                  </Text>{" "}
                  on open-ended thoughts or ideas.
                </Box>
              </Flex>
              <Separator size="4" />
              <Text size="2">The following discussion polls have been active recently:</Text>
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
          </SectionCard>
          {/* FIPs */}
          <SectionCard>
            <Flex direction="column" gap="4" mx="2" mt="3">
              <Flex gap="3">
                <Box>
                  <Text size="2">
                    <TbGitPullRequest color="#3fba50" />
                  </Text>
                </Box>
                <Box>
                  <Text weight="bold">Signal your position</Text> on FIPs through sentiment checks.
                </Box>
              </Flex>
              <Separator size="4" />
              <Text size="2">The following FIPs are currently open for sentiment checks:</Text>
              <ConversationsPreview
                conversations={conversations
                  .filter(
                    (c) =>
                      !c.is_archived &&
                      !c.is_hidden &&
                      c.fip_version?.github_pr?.title &&
                      c.fip_version?.fip_files_created,
                  )
                  .slice(0, 5)}
              />
            </Flex>
          </SectionCard>
        </Grid>
      </Container>
      {/* footer */}
      <Flex p="4" direction="row">
        <RouterLink to="/about">
          <Text weight="bold">About Fil Poll</Text>
        </RouterLink>
        <Box flexGrow="1" />
        Fil Poll &copy; 2024
      </Flex>
    </Box>
  )
}
