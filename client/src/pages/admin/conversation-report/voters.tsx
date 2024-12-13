// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

import React from "react"
import { Box, Heading } from "@radix-ui/themes"
import { VictoryChart, VictoryArea } from "victory"
import victoryTheme from "./victoryTheme"

class Voters extends React.Component<{
  size: number
  firstVoteTimes: Array<number>
}> {
  render() {
    const { size, firstVoteTimes } = this.props
    if (firstVoteTimes.length <= 1) return null /* no area chart with 1 data point */
    return (
      <Box mt="5">
        <Heading
          as="h6"
          size={{initial: "2", md: "3"}}
          my="2"
        >
          Voters over time, by time of first vote
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
            data={firstVoteTimes.map((d, i) => {
              return { x: new Date(d), y: i }
            })}
          />
        </VictoryChart>
      </Box>
    )
  }
}

export default Voters
