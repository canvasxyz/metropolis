import api from "../../../util/api"
import React from "react"
import PropTypes from "prop-types"
import Url from "../../../util/url"
import { RootState } from "../../../util/types"
import { connect } from "react-redux"
import { Heading, Box, Button } from "theme-ui"
import { Link } from "react-router-dom"
import ComponentHelpers from "../../../util/component-helpers"
import NoPermission from "../no-permission"

class ReportsList extends React.Component<
  {
    match: { params: { conversation_id: string } }
    zid_metadata: { is_mod: boolean; conversation_id: string }
  },
  {
    loading: boolean
    reports: Array<{ report_id: string }>
  }
> {
  static propTypes: {
    match: object
    zid_metadata: object
  }

  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      reports: [],
    }
  }

  getData() {
    const { match } = this.props
    const reportsPromise = api.get("/api/v3/reports", {
      conversation_id: match.params.conversation_id,
    })
    reportsPromise.then((reports) => {
      this.setState({
        loading: false,
        reports: reports,
      })
    })
  }

  componentDidMount() {
    const { zid_metadata } = this.props

    if (zid_metadata.is_mod) {
      this.getData()
    }
  }

  createReportClicked() {
    const { match } = this.props
    api
      .post("/api/v3/reports", {
        conversation_id: match.params.conversation_id,
      })
      .then(() => {
        this.getData()
      })
  }

  render() {
    if (ComponentHelpers.shouldShowPermissionsError(this.props)) {
      return <NoPermission />
    }

    if (this.state.loading) {
      return <div>Loading Reports...</div>
    }

    const conversation_id = this.props.zid_metadata.conversation_id

    return (
      <Box>
        <Box sx={{ mb: [3, null, 4] }}>
          {this.state.reports.length === 0 ? (
            <Button onClick={this.createReportClicked.bind(this)}>Create report url</Button>
          ) : (
            <Button
              onClick={() => {
                document.location = `/r/${conversation_id}/${this.state.reports[0].report_id}`
              }}
            >
              Go to full report
            </Button>
          )}
        </Box>
      </Box>
    )
  }
}

ReportsList.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      conversation_id: PropTypes.string,
    }),
  }),
  zid_metadata: PropTypes.shape({
    is_mod: PropTypes.bool,
  }),
}

export default connect((state: RootState) => state.zid_metadata)(ReportsList)
