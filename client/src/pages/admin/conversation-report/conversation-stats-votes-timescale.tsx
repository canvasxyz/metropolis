import React from "react"
import PropTypes from "prop-types"

import { VictoryChart } from "victory-chart"
import { VictoryLine } from "victory-line"
import { VictoryAxis } from "victory-axis"
import { scaleLinear, scaleTime } from "d3-scale"

class VotesTimescale extends React.Component<{
  chartWidth: number
  chartHeight: number
  data: { voteTimes: number[] }
}> {
  static propTypes: {
    chartWidth: unknown
    chartHeight: unknown
    data: object
  }

  render() {
    return (
      <VictoryChart
        width={this.props.chartWidth}
        height={this.props.chartHeight}
        scale={
          {
            x: scaleTime(this.props.data.voteTimes),
            y: scaleLinear(),
          } as any
        }
      >
        <VictoryLine
          style={{
            data: {
              strokeWidth: 2,
              stroke: "gold",
            },
          }}
          data={this.props.data.voteTimes.map((timestamp, i) => {
            return { x: timestamp, y: i }
          })}
        />
        <VictoryAxis orientation="bottom" />
        <VictoryAxis dependentAxis label={"Votes"} orientation={"left"} />
      </VictoryChart>
    )
  }
}

VotesTimescale.propTypes = {
  chartWidth: PropTypes.number,
  chartHeight: PropTypes.number,
  data: PropTypes.shape({
    voteTimes: PropTypes.arrayOf(PropTypes.number),
  }),
}

export default VotesTimescale
