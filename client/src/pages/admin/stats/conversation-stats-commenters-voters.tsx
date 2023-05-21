import React from "react"
import PropTypes from "prop-types"
import { VictoryChart } from "victory-chart"
import { VictoryLine } from "victory-line"
import { VictoryAxis } from "victory-axis"
import { scaleLinear, scaleTime } from "d3-scale"

class CommentersVoters extends React.Component<
  {
    chartWidth: number
    chartHeight: number
    data: {
      firstVoteTimes: number[]
      firstCommentTimes: number[]
    }
  },
  {}
> {
  static propTypes: {}

  render() {
    return (
      <VictoryChart
        width={this.props.chartWidth}
        height={this.props.chartHeight}
        scale={{
          x: scaleTime(this.props.data.firstVoteTimes),
          y: scaleLinear(),
        }}
      >
        <VictoryLine
          style={{
            data: {
              strokeWidth: 2,
              stroke: "tomato",
            },
          }}
          data={this.props.data.firstCommentTimes.map((timestamp, i) => {
            return { x: timestamp, y: i }
          })}
        />
        <VictoryLine
          style={{
            data: {
              strokeWidth: 2,
              stroke: "gold",
            },
          }}
          data={this.props.data.firstVoteTimes.map((timestamp, i) => {
            return { x: timestamp, y: i }
          })}
        />
        <VictoryAxis orientation="bottom" />
        <VictoryAxis
          dependentAxis
          label={"Participants"}
          style={{
            label: {
              fontSize: "8px",
            },
          }}
          orientation={"left"}
        />
      </VictoryChart>
    )
  }
}

CommentersVoters.propTypes = {
  chartWidth: PropTypes.number,
  chartHeight: PropTypes.number,
  data: PropTypes.shape({
    firstVoteTimes: PropTypes.arrayOf(PropTypes.number),
    firstCommentTimes: PropTypes.arrayOf(PropTypes.number),
  }),
}

export default CommentersVoters
