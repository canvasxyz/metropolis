import React from "react"

import ReportsList from "./reports-list"
import { Switch, Route } from "react-router-dom"

class Reports extends React.Component {
  render() {
    return (
      <div>
        <Switch>
          <Route exact component={ReportsList} />
        </Switch>
      </div>
    )
  }
}

export default Reports
