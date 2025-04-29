import React from "react"
import PolisSurvey from "."
import useSWR from "swr"
import { ZidMetadata } from "../../util/types"

type SurveyProps = { match: { params: { conversation_id: string } } }

const SurveyWithLoader = ({ match }: SurveyProps) => {
  const { data } = useSWR<ZidMetadata>(
    `conversation_${match.params.conversation_id}`,
    async () => {
      const response = await fetch(`/api/v3/conversation/${match.params.conversation_id}`)
      return await response.json()
    },
    { keepPreviousData: true, focusThrottleInterval: 500 },
  )

  // don't return anything if data not loaded yet
  if(data) {
    return <PolisSurvey
      conversation_id={match.params.conversation_id}
      help_type={data.help_type}
      postsurvey={data.postsurvey}
      postsurvey_limit={data.postsurvey_limit}
      postsurvey_redirect={data.postsurvey_redirect}
      auth_needed_to_write={data.auth_needed_to_write}
    />
  } else {
    // nothing
  }

}

export default SurveyWithLoader
