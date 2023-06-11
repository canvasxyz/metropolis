import React, { useEffect } from "react"
import TOSContent from "./tos.md"

const TOS: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <React.Fragment>
      <TOSContent />
      Contact: admin@{document.location.host}
    </React.Fragment>
  )
}

export default TOS
