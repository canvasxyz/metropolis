import { Link, Box, Button, Checkbox, DropdownMenu, Flex } from "@radix-ui/themes"
import React, { ReactNode, useRef } from "react"

export const ClickableChecklistItem = ({
  color,
  checked,
  setChecked,
  children,
  showOnly,
  selectOnly,
}: {
  color?: any
  checked: boolean
  setChecked: (value: boolean) => void
  children: ReactNode
  showOnly?: boolean
  selectOnly?: () => void
}) => {
  const ref = useRef(null)

  return (
    <DropdownMenu.Item
      onClick={(e) => {
        e.preventDefault()
        ref.current.click()
      }}
      className="contains-links-hover-white"
    >
      <Flex gap="2" align="center" width="100%">
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
        <Box flexGrow="1"></Box>
        {showOnly && (
          <Link
            className="link"
            onClick={(e) => {
              e.stopPropagation()
              selectOnly()
            }}
          >
            Only
          </Link>
        )}
      </Flex>
    </DropdownMenu.Item>
  )
}
