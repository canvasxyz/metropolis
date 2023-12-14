import React from "react"
import PropTypes from "prop-types"

import { VictoryChart } from "victory-chart"
import { VictoryLine } from "victory-line"
import { VictoryAxis } from "victory-axis"
import { scaleLinear, scaleTime } from "d3-scale"

class CommentsTimescale extends React.Component<
  {
    chartWidth: number
    chartHeight: number
    data: { commentTimes: number[] }
  },
  {}
> {
  static propTypes: object

  render() {
    return (
      <VictoryChart
        width={this.props.chartWidth}
        height={this.props.chartHeight}
        scale={
          {
            x: scaleTime(this.props.data.commentTimes),
            y: scaleLinear(),
          } as any
        }
      >
        <VictoryLine
          style={{
            data: {
              strokeWidth: 2,
              stroke: "tomato",
            },
          }}
          data={this.props.data.commentTimes.map((timestamp, i) => {
            return { x: timestamp, y: i }
          })}
        />
        <VictoryAxis orientation="bottom" />
        <VictoryAxis dependentAxis label={"Comments"} orientation={"left"} />
      </VictoryChart>
    )
  }
}

CommentsTimescale.propTypes = {
  chartWidth: PropTypes.number,
  chartHeight: PropTypes.number,
  data: PropTypes.shape({
    commentTimes: PropTypes.arrayOf(PropTypes.number),
  }),
}

export default CommentsTimescale
