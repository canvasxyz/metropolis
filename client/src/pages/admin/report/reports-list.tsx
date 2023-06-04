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
        <Heading
          as="h3"
          sx={{
            fontSize: [3, null, 4],
            lineHeight: "body",
            mb: [3, null, 4],
          }}
        >
          Report
        </Heading>
        <Box sx={{ mb: [3, null, 4] }}>
          <Button onClick={this.createReportClicked.bind(this)}>Create report url</Button>
        </Box>
        {this.state.reports.map((report) => (
          <Box sx={{ mb: [2] }} key={report.report_id}>
            <Link sx={{ variant: "links.text" }} to={`/r/${conversation_id}/${report.report_id}`}>
              {document.location.host}/r/{conversation_id}/{report.report_id}
            </Link>
          </Box>
        ))}
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
