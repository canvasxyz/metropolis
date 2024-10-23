import { useState } from "react"
import { useLocalStorage } from "usehooks-ts"

export const useFipDisplayOptions = () => {
  const [savedDisplayOptions, setSavedDisplayOptions] = useLocalStorage(
    "fipTrackerDisplayOptions",
    JSON.stringify({
      showAuthors: true,
      showCreationDate: true,
      showType: true,
      showCategory: true,
      sortBy: "desc"
    }),
  )
  const initialSavedDisplayOptions = JSON.parse(savedDisplayOptions)
  const [showAuthors, setShowAuthors] = useState(initialSavedDisplayOptions.showAuthors)
  const [showCreationDate, setShowCreationDate] = useState(
    initialSavedDisplayOptions.showCreationDate,
  )
  const [showType, setShowType] = useState(initialSavedDisplayOptions.showType)
  const [showCategory, setShowCategory] = useState(initialSavedDisplayOptions.showCategory)


  const [sortBy, setSortBy] = useState<"desc" | "asc">(initialSavedDisplayOptions.sortBy)

  const resetDisplayOptions = () => {
    setShowAuthors(true)
    setShowCategory(true)
    setShowCreationDate(true)
    setShowType(true)
  }

  const saveDisplayOptions = () => {
    setSavedDisplayOptions(
      JSON.stringify({ showAuthors, showCategory, showCreationDate, showType, sortBy }),
    )
  }

  return {
    showAuthors,
    setShowAuthors,
    showCategory,
    setShowCategory,
    showCreationDate,
    setShowCreationDate,
    showType,
    setShowType,
    sortBy,
    setSortBy,
    resetDisplayOptions,
    saveDisplayOptions,
  }
}
