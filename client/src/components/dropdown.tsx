import React, { useEffect, useState, useRef } from "react"
import { connect, useDispatch, useSelector } from "react-redux"
import { Box, Heading, Button, Text, Textarea, Flex, jsx } from "theme-ui"

import { TbChevronDown } from "react-icons/tb"

type DropdownMenuOptions = Array<{
  name: string
  onClick: Function
}>

const DropdownMenu = ({
  sx,
  rightAlign,
  options,
}: {
  sx?
  rightAlign?: boolean
  options: DropdownMenuOptions
}) => {
  const [open, setOpen] = useState(false)

  return (
    <Box sx={{ ...sx, position: "relative" }}>
      <Button
        variant="outlineSecondary"
        sx={{ px: 2, py: 1 }}
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
          borderRadius: "3px",
          bg: "primary",
          position: "absolute",
          right: rightAlign ? "0" : undefined,
          whiteSpace: "nowrap",
          display: open ? "block" : "none",
        }}
      >
        {options.map((option, index) => {
          return (
            <Button variant="outlineGray" key={index} onClick={option.onClick}>
              {option.name}
            </Button>
          )
        })}
      </Box>
    </Box>
  )
}

type DropdownButtonOptions = Array<{
  name: string
  onClick: Function
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
        sx={{ borderRadius: "3px 0 0 3px", borderRight: "1px solid #88bffc" }}
        onClick={defaultOption.onClick}
      >
        {defaultOption.name}
      </Button>
      <Button
        sx={{ borderRadius: "0 3px 3px 0", pr: "6px", pl: "6px" }}
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
          borderRadius: "3px",
          bg: "primary",
          position: "absolute",
          right: rightAlign ? "0" : undefined,
          whiteSpace: "nowrap",
          display: open ? "block" : "none",
        }}
      >
        {dropdownOptions.map((option, index) => {
          return (
            <Button variant="outlineGray" key={index} onClick={option.onClick}>
              {option.name}
            </Button>
          )
        })}
      </Box>
    </Box>
  )
}

export { DropdownMenu, DropdownButton }
