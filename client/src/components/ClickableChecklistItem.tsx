import { Checkbox, DropdownMenu } from "@radix-ui/themes"
import React, { ReactNode, useRef } from "react"

export const ClickableChecklistItem = ({
  color,
  checked,
  setChecked,
  children,
}: {
  color?: any
  checked: boolean
  setChecked: (value: boolean) => void
  children: ReactNode
}) => {
  const ref = useRef(null)

  return (
    <DropdownMenu.Item
      onClick={(e) => {
        e.preventDefault()
        ref.current.click()
      }}
    >
      <Checkbox
        color={color}
        ref={ref}
        checked={checked}
        onCheckedChange={(c) => {
          // @ts-expect-error assume that the value can never be 'indeterminate'
          setChecked(c)
        }}
      />
      {children}
    </DropdownMenu.Item>
  )
}
