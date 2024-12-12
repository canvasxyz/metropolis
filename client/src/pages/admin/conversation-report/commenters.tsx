import React from "react"
import { Box, Heading } from "@radix-ui/themes"
import { VictoryChart, VictoryArea } from "victory"
import victoryTheme from "./victoryTheme"

class Commenters extends React.Component<{
  size: number
  firstCommentTimes: number[]
}> {
  render() {
    const { size, firstCommentTimes } = this.props
    if (firstCommentTimes.length <= 1) return null /* handle seed commenter */
    return (
      <Box mt="5">
        <Heading
          as="h6"
          size={{ initial: "2", md: "3"}}
          my="2"
        >
          Commenters over time, by time of first comment
        </Heading>
        <VictoryChart
          theme={victoryTheme}
          height={size}
          width={size}
          domainPadding={{ x: 0, y: [0, 20] }}
          scale={{ x: "time" }}
        >
          <VictoryArea
            style={{ data: { fill: "#03a9f4" } }}
            data={firstCommentTimes.map((d, i) => {
              return { x: new Date(d), y: i }
            })}
          />
        </VictoryChart>
      </Box>
    )
  }
}

export default Commenters
