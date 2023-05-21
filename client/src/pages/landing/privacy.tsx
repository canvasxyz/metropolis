import React from "react"
import PrivacyContent from "./privacy.md"

class Privacy extends React.Component {
  render() {
    return (
      <React.Fragment>
        <PrivacyContent />
        Contact: admin@{document.location.host}
      </React.Fragment>
    )
  }
}

export default Privacy
