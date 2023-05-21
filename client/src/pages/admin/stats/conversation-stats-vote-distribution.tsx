import React from "react"
import PropTypes from "prop-types"
import { VictoryChart } from "victory-chart"
import { VictoryBar } from "victory-bar"
import { VictoryAxis } from "victory-axis"

class VotesDistribution extends React.Component<
  {
    chartWidth: number
    chartHeight: number
    data: {
      votesHistogram: Array<{ n_votes: number; n_ptpts: number }>
    }
  },
  {}
> {
  static propTypes: {
    chartWidth: unknown
    chartHeight: unknown
    data: object
  }

  render() {
    return (
      <VictoryChart width={this.props.chartWidth} height={this.props.chartHeight}>
        <VictoryAxis
          tickCount={7}
          label="Vote count"
          style={{
            data: {
              axis: {
                stroke: "black",
                strokeWidth: 1,
              },
              ticks: {
                stroke: "transparent",
              },
              tickLabels: {
                fill: "black",
              },
            },
          }}
        />
        <VictoryAxis
          label="Participant count"
          orientation={"left"}
          dependentAxis
          style={{
            data: {
              axis: {
                stroke: "black",
                strokeWidth: 1,
              },
              ticks: {
                stroke: "transparent",
              },
              tickLabels: {
                fill: "black",
              },
            },
          }}
        />
        <VictoryBar
          style={{
            data: {
              fill: "cornflowerblue",
              width: 1,
            },
          }}
          data={this.props.data.votesHistogram.map((d) => {
            return {
              x: d.n_votes,
              y: d.n_ptpts,
            }
          })}
        />
      </VictoryChart>
    )
  }
}

VotesDistribution.propTypes = {
  chartWidth: PropTypes.number,
  chartHeight: PropTypes.number,
  data: PropTypes.shape({
    votesHistogram: PropTypes.arrayOf(
      PropTypes.shape({
        n_votes: PropTypes.number,
        n_ptpts: PropTypes.number,
      })
    ),
  }),
}

export default VotesDistribution
