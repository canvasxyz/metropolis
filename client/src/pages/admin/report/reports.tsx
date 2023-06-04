import React from "react"
import { connect } from "react-redux"
import { Switch, Route } from "react-router-dom"

import ReportsList from "./reports-list"
import { RootState } from "../../../util/types"

const Reports: React.FC<{ zid_metadata }> = ({ zid_metadata }) => {
  if (Object.keys(zid_metadata).length === 0) return <></>

  return (
    <div>
      <Switch>
        <Route exact component={ReportsList} />
      </Switch>
    </div>
  )
}

export default connect((state: RootState) => state.zid_metadata)(Reports)
