/** @jsx jsx */

import React from "react"
import { ConnectedProps, connect } from "react-redux"
import { UrlObject } from "url"
import { Heading, Box, jsx } from "theme-ui"

import dateSetupUtil from "../../../util/data-export-date-setup"
import ComponentHelpers from "../../../util/component-helpers"
import { populateConversationStatsStore } from "../../../actions"

import NumberCards from "./conversation-stats-number-cards"
import Voters from "./voters"
import Commenters from "./commenters"
import NoPermission from "../no-permission"
import ReportsList from "./reports-list"
import { AppDispatch, RootState } from "../../../store"

const connector = connect((state: RootState) => ({
  ...state.zid_metadata,
  ...state.stats
}))
type PropsFromRedux = ConnectedProps<typeof connector>
type ConversationStatsPropTypes = PropsFromRedux & {
  dispatch: AppDispatch
  match: { params: { conversation_id: string }; location: UrlObject }
}

class ConversationStats extends React.Component<
  ConversationStatsPropTypes,
  {
    months: any[]
    years: any[]
    days: any[]
    tzs: any[]
    until?: number
  }
> {
  getStatsRepeatedly: ReturnType<typeof setInterval>
  chartSize: number
  refs: {
    exportSelectYear: HTMLSelectElement
    exportSelectMonth: HTMLSelectElement
    exportSelectDay: HTMLSelectElement
    exportSelectHour: HTMLSelectElement
  }

  constructor(props) {
    super(props)
    const times = dateSetupUtil()
    this.chartSize = 500
    this.state = Object.assign({}, times)
  }

  handleUntilButtonClicked() {
    const year = this.refs.exportSelectYear.value
    const month = this.refs.exportSelectMonth.value
    const dayOfMonth = this.refs.exportSelectDay.value
    const tz = this.refs.exportSelectHour.value
    const dateString = [month, dayOfMonth, year, tz].join(" ")
    const dddate = new Date(dateString)
    const until = Number(dddate)
    this.setState(
      {
        until: until,
      },
      function () {
        this.loadStats()
      }
    )
  }

  loadStats() {
    const { match } = this.props

    const until = this.state.until
    this.props.dispatch(populateConversationStatsStore(match.params.conversation_id, until))
  }

  componentDidMount() {
    const { zid_metadata } = this.props

    if (zid_metadata.is_owner) {
      this.loadStats()
      this.getStatsRepeatedly = setInterval(() => {
        this.loadStats()
      }, 10000)
    }
  }

  componentWillUnmount() {
    const { zid_metadata } = this.props

    if (zid_metadata.is_owner) {
      clearInterval(this.getStatsRepeatedly)
    }
  }

  render() {
    if (ComponentHelpers.shouldShowPermissionsError(this.props)) {
      return <NoPermission />
    }

    const { conversation_stats } = this.props
    const loading =
      !conversation_stats ||
      !conversation_stats[this.props.match.params.conversation_id] ||
      !conversation_stats[this.props.match.params.conversation_id].firstCommentTimes ||
      !conversation_stats[this.props.match.params.conversation_id].firstVoteTimes

    if (loading) return <Box>Loading...</Box>

    return (
      <div>
        <Heading
          as="h3"
          sx={{
            fontSize: [3, null, 4],
            lineHeight: "body",
            mb: [3, null, 2],
          }}
        >
          Report
        </Heading>
        <NumberCards data={conversation_stats[this.props.match.params.conversation_id]} />
        <ReportsList conversation_id={this.props.match.params.conversation_id} />
        {/* activity charts */}
        <Voters
          firstVoteTimes={
            conversation_stats[this.props.match.params.conversation_id].firstVoteTimes
          }
          size={this.chartSize}
        />
        <Commenters
          firstCommentTimes={
            conversation_stats[this.props.match.params.conversation_id].firstCommentTimes
          }
          size={this.chartSize}
        />
      </div>
    )
  }
}

export default connector(ConversationStats)
