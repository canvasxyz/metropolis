import React, { useEffect } from "react"
import { Heading } from "theme-ui"

import { doSignout } from "../../actions"
import { useAppDispatch } from "../../hooks"

function SignOut() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(doSignout("/"))
  }, [dispatch])

  return (
    <>
      <Heading as="h1" sx={{ my: [4, null, 5], fontSize: [6] }}>
        Signing Out...
      </Heading>
      <p>Please wait a second to be signed out.</p>
    </>
  )
}


export default SignOut
