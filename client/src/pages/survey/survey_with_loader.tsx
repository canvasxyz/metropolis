import React, { useEffect } from "react"
import Survey from "."
import { populateZidMetadataStore, resetMetadataStore } from "../../actions"
import { useAppDispatch } from "../../hooks"

type SurveyProps = { match: { params: { conversation_id: string } } }

const SurveyWithLoader = ({ match }: SurveyProps) => {
  const dispatch = useAppDispatch()
  const conversation_id = match.params.conversation_id

  useEffect(() => {
    dispatch(populateZidMetadataStore(conversation_id))
    return () => {
      dispatch(resetMetadataStore())
    }
  }, [conversation_id])

  return <Survey match={match} />
}

export default SurveyWithLoader
