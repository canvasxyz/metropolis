import React, { useRef } from "react"
import { Box, Text } from "@radix-ui/themes"

type CheckboxFieldProps = {
  label: string
  subtitle?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export const CheckboxField = ({ label, subtitle, checked, onCheckedChange }: CheckboxFieldProps) => {

  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Box mb="3">
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
      {subtitle && <Text ml="2" color="gray">{subtitle}</Text>}
    </Box>
  )
}
