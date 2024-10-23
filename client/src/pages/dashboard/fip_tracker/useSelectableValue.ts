import { useEffect, useState } from "react"

export const useSelectableValue = (items: string[] | null) => {
  const [selectedValues, setSelectedValues] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (items && items.length > 0) {
      setSelectedValues((oldSelectedValues) => {
        const newSelectedValues = { ...oldSelectedValues }
        for (const item of items) {
          // if there is a new selectable item that has not been seen before, select it by default
          if (oldSelectedValues[item] === undefined) {
            newSelectedValues[item] = true
          }
        }
        return newSelectedValues
      })
    }
  }, [items])

  return { selectedValues, setSelectedValues }
}
