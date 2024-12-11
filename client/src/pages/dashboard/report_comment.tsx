import React from "react"
import { Box, Flex, Text } from "@radix-ui/themes"

export type ReportComment = {
  active: boolean
  agree_count: number
  conversation_id: string
  count: number
  created: string
  disagree_count: number
  is_meta: boolean
  is_seed: boolean
  lang: string | null
  mod: number
  pass_count: number
  pid: number
  quote_src_url: string | null
  tid: number
  tweet_id: string | null
  txt: string
  velocity: number
}

export const ReportCommentRow = ({
  reportComment,
  maxCount,
}: {
  reportComment: ReportComment
  maxCount: number
}) => {
  const { agree_count, disagree_count, pass_count, tid, txt } = reportComment

  return (
    <Box key={tid}>
      <Flex
        mb="1"
        pt="12px"
        pb="10px"
        pl="20px"
        pr="15px"
        style={{
          backgroundColor: "#faf9f6",
          border: "1px solid #e2ddd5",
          borderRadius: "7px",
        }}
      >
        <Box
          pr="1">
          <Text
            style={{ fontSize: "0.91em", lineHeight: 1.3}}>
            {txt}
          </Text>
        </Box>
        <Box position="relative" pl="3" ml="auto">
          <Flex>
            <Box width="70px" style={{ display: "inline-block", fontSize: "0.88em", left: "4px" }}>Agree</Box>
            <Box width="70px">
              <Box
                width={`${Math.ceil((agree_count / maxCount) * 100)}%`}
                px="1px"
                py="2px"
                style={{
                  backgroundColor: "#2fcc71",
                  color: agree_count / maxCount < 0.2 ? "#222" : "#fff",
                  lineHeight: 1.2
                }}
              >
                <Text style={{ display: "inline-block", fontSize: "0.88em", left: "4px" }}>{agree_count}</Text>
              </Box>
            </Box>
          </Flex>
          <Flex>
            <Box width="70px" style={{ display: "inline-block", fontSize: "0.88em", left: "4px" }}>Disagree</Box>
            <Box width="70px">
              <Box
                width={`${Math.ceil((disagree_count / maxCount) * 100)}%`}
                px="1px"
                py="2px"
                style={{
                  backgroundColor: "#e74b3c",
                  color: disagree_count / maxCount < 0.2 ? "#222" : "#fff",
                  lineHeight: 1.2
                }}
              >
                <Text style={{ display: "inline-block", fontSize: "0.88em", left: "4px" }}>{disagree_count}</Text>
              </Box>
            </Box>
          </Flex>
          <Flex>
            <Box width="70px" style={{ display: "inline-block", fontSize: "0.88em", left: "4px" }}>Pass</Box>
            <Box width="70px">
              <Box
                width={`${Math.ceil((pass_count / maxCount) * 100)}%`}
                px="1px"
                py="2px"
                style={{
                  backgroundColor: "#e6e6e6",
                  lineHeight: 1.2
                }}
              >
                <Text style={{ display: "inline-block", fontSize: "0.88em", left: "4px" }}>{pass_count}</Text>
              </Box>
            </Box>
          </Flex>
        </Box>
      </Flex>
    </Box>
  )
}
