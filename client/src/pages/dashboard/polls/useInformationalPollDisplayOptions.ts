import { useState } from "react"
import { toast } from "react-hot-toast"
import { useLocalStorage } from "usehooks-ts"

export const useInformationalPollDisplayOptions = () => {
  const [savedDisplayOptions, setSavedDisplayOptions] = useLocalStorage(
    "informationalPollDisplayOptions",
    JSON.stringify({
      sortBy: "desc"
    }),
  )
  const initialSavedDisplayOptions = JSON.parse(savedDisplayOptions)

  const [sortBy, setSortBy] = useState<"desc" | "asc">(initialSavedDisplayOptions.sortBy)

  const resetDisplayOptions = () => {
    toast.success("Reset saved display options for Discussion Polls")
    setSortBy(initialSavedDisplayOptions.sortBy)
  }

  const saveDisplayOptions = () => {
    toast.success("Saved display options for Discussion Polls")
    setSavedDisplayOptions(
      JSON.stringify({  sortBy }),
    )
  }

  return {
    sortBy,
    setSortBy,
    resetDisplayOptions,
    saveDisplayOptions,
  }
}
