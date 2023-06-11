import React, { useEffect } from "react"
import PrivacyContent from "./privacy.md"

const Privacy: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <React.Fragment>
      <PrivacyContent />
      Contact: admin@{document.location.host}
    </React.Fragment>
  )
}

export default Privacy
