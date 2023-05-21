import React from "react"
import PropTypes from "prop-types"
import NumberCard from "./conversation-stats-number-card"

class NumberCards extends React.Component<
  {
    data: {
      firstVoteTimes: number[]
      firstCommentTimes: number[]
      voteTimes: number[]
      commentTimes: number[]
    }
  },
  {}
> {
  static propTypes: any

  render() {
    const data = this.props.data
    const averageVotes = data.voteTimes.length / data.firstVoteTimes.length
    return (
      <div>
        <NumberCard datum={data.firstVoteTimes.length} subheading="participants voted" />
        <NumberCard datum={data.voteTimes.length} subheading="votes were cast" />
        <NumberCard
          datum={isNaN(averageVotes) ? 0 : averageVotes.toFixed(2)}
          subheading="votes per participant on average"
        />
        <NumberCard datum={data.firstCommentTimes.length} subheading="commented" />
        <NumberCard datum={data.commentTimes.length} subheading="comments submitted" />
      </div>
    )
  }
}

NumberCards.propTypes = {
  data: PropTypes.shape({
    firstVoteTimes: PropTypes.arrayOf(PropTypes.number),
    firstCommentTimes: PropTypes.arrayOf(PropTypes.number),
    voteTimes: PropTypes.arrayOf(PropTypes.number),
    commentTimes: PropTypes.arrayOf(PropTypes.number),
  }),
}

export default NumberCards
