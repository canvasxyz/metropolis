// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

import React from 'react'
import PropTypes from 'prop-types'
import NumberCard from './conversation-stats-number-card'

class NumberCards extends React.Component<{
  data: {
    firstVoteTimes: number[],
    firstCommentTimes: number[],
    voteTimes: number[],
    commentTimes: number[],
  }
}, {}> {
  static propTypes: any

  render() {
    const data = this.props.data
    const averageVotes = (
      data.voteTimes.length / data.firstVoteTimes.length
    )
    return (
      <div>
        <NumberCard
          datum={data.firstVoteTimes.length}
          subheading="participants voted"
        />
        <NumberCard
          datum={data.voteTimes.length}
          subheading="votes were cast"
        />
        <NumberCard
          datum={isNaN(averageVotes) ? 0 : averageVotes.toFixed(2)}
          subheading="votes per participant on average"
        />
        <NumberCard
          datum={data.firstCommentTimes.length}
          subheading="commented"
        />
        <NumberCard
          datum={data.commentTimes.length}
          subheading="comments submitted"
        />
      </div>
    )
  }
}

NumberCards.propTypes = {
  data: PropTypes.shape({
    firstVoteTimes: PropTypes.arrayOf(PropTypes.number),
    firstCommentTimes: PropTypes.arrayOf(PropTypes.number),
    voteTimes: PropTypes.arrayOf(PropTypes.number),
    commentTimes: PropTypes.arrayOf(PropTypes.number)
  })
}

export default NumberCards
