import React from "react"
import TOSContent from "./tos.md"

class TOS extends React.Component {
  render() {
    return (
      <React.Fragment>
        <TOSContent />
        Contact: admin@{document.location.host}
      </React.Fragment>
    )
  }
}

export default TOS
