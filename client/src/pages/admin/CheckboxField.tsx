import React, { ChangeEventHandler, useRef } from "react"
import { Box, Text } from "theme-ui"

type CheckboxFieldProps = {
  label: string
  subtitle?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export const CheckboxField = ({ label, subtitle, checked, onCheckedChange }: CheckboxFieldProps) => {

  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Box sx={{ mb: [3] }}>
      <label>
        <input
          ref={inputRef}
          type="checkbox"
          checked={checked}
          onChange={() => {
            if (inputRef.current) {
              console.log("updating check box, checked:", inputRef.current.checked)
              onCheckedChange(inputRef.current.checked)
            }
          }}
        />
        &nbsp;<strong>{label}</strong>
      </label>
      {subtitle && <Text sx={{ display: "inline", ml: [2], color: "lightGray" }}>{subtitle}</Text>}
    </Box>
  )
}
