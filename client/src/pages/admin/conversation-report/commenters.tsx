/** @jsx jsx */

import React from "react"
import { jsx, Box, Heading } from "theme-ui"
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
      <Box sx={{ mt: [5] }}>
        <Heading
          as="h6"
          sx={{
            fontSize: [2, null, 3],
            lineHeight: "body",
            my: [2],
          }}
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
