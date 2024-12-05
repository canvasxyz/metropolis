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
          <Text color="gray">None found</Text>
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
            <Flex gap="2" py="2px" style={{ cursor: "pointer" }}>
              <Box mx="6px">
                <Text size="2">
                  {fipVersion?.github_pr?.title ? (
                    getIconForConversation(c)
                  ) : (
                    <BiSolidBarChartAlt2 color="#0090ff" />
                  )}
                </Text>
              </Box>
              <Box style={{ lineHeight: "1.35" }}>
                <Box>
                  {fipVersion ? (
                    <Text style={{ lineHeight: "1.35" }}>
                      <Text weight="bold" style={{ lineHeight: "1.35" }}>
                        FIP
                        {fipVersion.fip_number
                          ? String(fipVersion.fip_number).padStart(4, "0")
                          : ""}
                        :{" "}
                      </Text>
                      {fipVersion.fip_title || fipVersion.github_pr?.title}
                    </Text>
                  ) : (
                    c.topic
                  )}
                </Box>
                <Box mt="3px">
                  <Text size="2" style={{ color: "#888" }}>
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
        <Flex direction="column" align="center" justify="center" pt="16px">
          <img src="/filecoin.png" width="54px" height="54px" />
          <Box pb="10px" pt="16px">
            <Text size="6" weight="bold">
              Welcome to Fil Poll
            </Text>
          </Box>
          A nonbinding sentiment check tool for the Filecoin community
        </Flex>
        <Grid columns={{ initial: "1", md: "2" }} gap="3" py="26px" mx="2">
          {/* discussions */}
          <SectionCard>
            <Flex direction="column" gap="4" mx="2" mt="3">
              <Flex gap="3">
                <Box>
                  <Text size="2">
                    <BiSolidBarChartAlt2 color="#0090ff" />
                  </Text>
                </Box>
                <Box style={{ "line-height": "1.35" }}>
                  <Text weight="bold" style={{ "line-height": "1.35" }}>
                    Initiate discussions, collect feedback, and respond to polls
                  </Text>{" "}
                  on open-ended thoughts or ideas.
                </Box>
              </Flex>
              <Separator size="4" />
              <Text style={{ "line-height": "1.35" }}>
                The following discussion polls have been active recently:
              </Text>
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
                <Box style={{ "line-height": "1.35" }}>
                  <Text weight="bold" style={{ "line-height": "1.35" }}>
                    Signal your position
                  </Text>{" "}
                  on FIPs through sentiment checks.
                </Box>
              </Flex>
              <Separator size="4" />
              <Text style={{ "line-height": "1.35" }}>
                The following FIPs are currently open for sentiment checks:
              </Text>
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
      <Flex p="4" px="5" direction="row" style={{ fontSize: "0.91em" }}>
        <RouterLink to="/about">
          <Text weight="bold">About Fil Poll</Text>
        </RouterLink>
        <Box flexGrow="1" />
        <Text color="gray">Fil Poll &copy; 2024</Text>
      </Flex>
    </Box>
  )
}
