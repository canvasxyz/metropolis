import React, { useState } from "react"
import { Box, Button } from "theme-ui"

import { TbChevronDown } from "react-icons/tb"

type DropdownMenuOptions = Array<{
  name: string | React.ReactNode
  onClick
  sx?
}>

let isFocused

const DropdownMenu = ({
  buttonSx,
  variant,
  rightAlign,
  options,
}: {
  buttonSx?
  variant?: string
  rightAlign?: boolean
  options: DropdownMenuOptions
}) => {
  const [open, setOpen] = useState(false)

  return (
    <Box sx={{ position: "relative" }}>
      <Button
        variant={variant || "outlineLightGray"}
        sx={{ px: 2, py: 1 }}
        onClick={() => setOpen(!open)}
        onFocus={() => {
          isFocused = -1
        }}
        onBlur={() =>
          setTimeout(() => {
            if (isFocused === -1) setOpen(false)
          }, 10)
        }
      >
        <Box sx={{ position: "relative", top: "2px" }}>
          <TbChevronDown />
        </Box>
      </Button>
      <Box
        sx={{
          mt: "1px",
          borderRadius: "6px",
          bg: "white",
          position: "absolute",
          right: rightAlign ? "0" : undefined,
          whiteSpace: "nowrap",
          display: open ? "block" : "none",
          zIndex: 999,
        }}
      >
        {options.map((option, index) => {
          return (
            <Button
              onFocus={() => {
                isFocused = index
              }}
              onBlur={() =>
                setTimeout(() => {
                  if (isFocused === index) setOpen(false)
                }, 10)
              }
              variant={variant || "outlineLightGray"}
              sx={{
                display: "block",
                width: "100%",
                outline: "none",
                boxShadow: "none",
                borderBottom: index === options.length - 1 ? undefined : "none",
                borderRadius:
                  options.length === 1
                    ? "8px"
                    : index === 0
                    ? "8px 8px 0 0"
                    : index === options.length - 1
                    ? "0 0 8px 8px"
                    : "0",
                ...buttonSx,
                ...option.sx,
              }}
              key={index}
              onClick={option.onClick}
            >
              {option.name}
            </Button>
          )
        })}
      </Box>
    </Box>
  )
}

type DropdownButtonOptions = Array<{
  name: string | React.ReactNode
  onClick
  default?: boolean
}>

const DropdownButton = ({
  sx,
  rightAlign,
  options,
}: {
  sx?
  rightAlign?: boolean
  options: DropdownButtonOptions
}) => {
  const [open, setOpen] = useState(false)

  const defaultOption = options.find((o) => o.default)
  if (!defaultOption) {
    throw new Error("DropdownButton must have a default option")
  }
  const dropdownOptions = options.filter((o) => !o.default)

  return (
    <Box sx={{ ...sx, position: "relative" }}>
      <Button
        sx={{
          borderRadius: "4px 0 0 4px",
          borderRight: "1px solid #fbf5e9",
          py: "7px",
          pb: "6px",
        }}
        onClick={defaultOption.onClick}
      >
        {defaultOption.name}
      </Button>
      <Button
        sx={{
          borderRadius: "0 4px 4px 0",
          pr: "6px",
          pl: "6px",
          py: "7px",
          pb: "6px",
        }}
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 10)}
      >
        <Box sx={{ position: "relative", top: "2px" }}>
          <TbChevronDown />
        </Box>
      </Button>
      <Box
        sx={{
          mt: "1px",
          borderRadius: "4px",
          bg: "primary",
          position: "absolute",
          right: rightAlign ? "0" : undefined,
          whiteSpace: "nowrap",
          display: open ? "block" : "none",
        }}
      >
        {dropdownOptions.map((option, index) => {
          return (
            <Button variant="outlineLightGray" key={index} onClick={option.onClick}>
              {option.name}
            </Button>
          )
        })}
      </Box>
    </Box>
  )
}

export { DropdownMenu, DropdownButton }
