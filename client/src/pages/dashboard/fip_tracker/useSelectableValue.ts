import { useEffect, useState } from "react"
import useSWR from "swr"

export const useSelectableValue = (items: string[] | null) => {
  const [selectedValues, setSelectedValues] = useState<Record<string, boolean>>({})

  useEffect(() => {
    console.log(items)
    console.log("updating items...")
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
