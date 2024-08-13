import React from "react"
import { IconType } from "react-icons"
import { Flex, Text } from "theme-ui"

// TODO: we should decide on a better name for this concept
export const ListingSelector = ({
  iconType,
  label,
  isSelected,
  onClick,
}: {
  iconType: IconType
  label: string
  isSelected: boolean
  onClick: () => void
}) => {
  const iconComponent = iconType({ size: "1.5em", style: { position: "relative", top: 0 } })

  return (
    <Flex
      onClick={onClick}
      sx={{
        m: 2,
        p: 2,
        borderRadius: "8px",
        alignItems: "center",
        gap: "8px",
        cursor: "pointer",
        userSelect: "none",
        ...(isSelected ? { bg: "#D5EFFF", color: "#006BCA" } : { color: "#60646C" }),
        // TODO: Add hover effect
      }}
    >
      {iconComponent}
      <Text sx={isSelected ? { fontWeight: 600 } : {}}>{label}</Text>
    </Flex>
  )
}
