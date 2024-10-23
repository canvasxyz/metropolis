import { useEffect, useState } from "react"

export const useSelectableValue = (items: string[] | null) => {
  const [selectedValues, setSelectedValues] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (items && items.length > 0) {
      setSelectedValues((oldSelectedValues) => {
        const newSelectedValues = { ...oldSelectedValues }
        for (const item of items) {
          if (!oldSelectedValues.hasOwnProperty(item)) {
            newSelectedValues[item] = true
          }
        }
        return newSelectedValues
      })
    }
  }, [items])

  return { selectedValues, setSelectedValues }
}
