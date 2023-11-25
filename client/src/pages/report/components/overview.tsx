// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

import React from "react"
import _ from "lodash"
import * as globals from "./globals"

const computeVoteTotal = (users) => {
  let voteTotal = 0

  _.each(users, (count) => {
    voteTotal += count
  })

  return voteTotal
}

// const computeUniqueCommenters = (comments) => {

// }

const Number = ({ number, label }) => (
  <div style={{ marginLeft: "10px", marginRight: "10px" }}>
    <p style={globals.overviewNumber}>{number?.toLocaleString() ?? "--"}</p>
    <p style={globals.overviewLabel}>{label}</p>
  </div>
)

const Overview = ({
  conversation,
  // demographics,
  ptptCount,
  ptptCountTotal,
  math,
  // comments,
  //stats,
  computedStats,
}) => {
  return (
    <div>
      <p style={globals.primaryHeading}>Overview</p>
      <p style={globals.paragraph}>
        Metropolis is a real-time survey system that helps identify different ways a group thinks
        about a topic or question.
      </p>
      <p style={globals.paragraph}>
        Participants submit responses for other participants to vote on. Responses are assigned a
        number in the order they’re submitted.
      </p>
      <p style={globals.paragraph}>
        Voters are sorted into opinion groups, which include participants who voted similarly to
        each other, and differently from other opinion groups.
      </p>

      <p style={globals.paragraph}>
        {conversation && conversation.ownername
          ? "This conversation was run by " + conversation.ownername + ". "
          : null}
        {conversation && conversation.topic ? "The topic was '" + conversation.topic + "'. " : null}
      </p>
      <div style={{ maxWidth: 1200, display: "flex", justifyContent: "space-between" }}>
        <Number number={ptptCountTotal} label={"people voted"} />
        <Number number={ptptCount} label={"people grouped"} />

        <Number number={computeVoteTotal(math["user-vote-counts"])} label={"votes were cast"} />
        <Number number={math["n-cmts"]} label={"statements were submitted"} />
        <Number
          number={
            isNaN(computedStats.votesPerVoterAvg) ? "--" : computedStats.votesPerVoterAvg.toFixed(2)
          }
          label={"votes per voter on average"}
        />
        <Number
          number={computedStats.commentsPerCommenterAvg.toFixed(2)}
          label={"statements per author on average"}
        />
      </div>
    </div>
  )
}

export default Overview
