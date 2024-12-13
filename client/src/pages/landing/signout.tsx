import React, { useEffect } from "react"
import { Heading } from "@radix-ui/themes"

import { doSignout } from "../../actions"
import { useAppDispatch } from "../../hooks"

function SignOut() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(doSignout("/"))
  }, [dispatch])

  return (
    <>
      <Heading
        as="h1"
        my={{initial: "4", md: "5"}}
        size="6"
      >
        Signing Out...
      </Heading>
      <p>Please wait a second to be signed out.</p>
    </>
  )
}


export default SignOut
