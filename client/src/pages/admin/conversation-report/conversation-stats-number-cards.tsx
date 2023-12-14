import React from "react"
import PropTypes from "prop-types"
import NumberCard from "./conversation-stats-number-card"
import { Box } from "theme-ui"

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
    // const averageVotes = data.voteTimes.length / data.firstVoteTimes.length
    return (
      <Box sx={{ display: "flex" }}>
        <Box sx={{ flex: 1 }}>
          <NumberCard datum={data.firstVoteTimes.length} subheading="participants voted" />
          <NumberCard datum={data.voteTimes.length} subheading="votes were cast" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <NumberCard
            datum={data.firstCommentTimes.length}
            subheading="participants wrote comments"
          />
          <NumberCard datum={data.commentTimes.length} subheading="comments submitted" />
        </Box>
      </Box>
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
