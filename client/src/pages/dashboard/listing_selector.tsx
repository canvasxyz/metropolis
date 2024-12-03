import React from "react"
import { IconType } from "react-icons"
import { NavLink } from "react-router-dom-v5-compat"
import { Flex, Text } from "theme-ui"

// TODO: we should decide on a better name for this concept
export const ListingSelector = ({
  iconType,
  label,
  to,
}: {
  iconType: IconType
  label: string
  to: string
}) => {
  const iconComponent = iconType({ size: "1.5em", style: { position: "relative", top: 0 } })

  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <Flex
          sx={{
            m: 2,
            p: 2,
            borderRadius: "8px",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            userSelect: "none",
            ...(isActive
              ? { bg: "#D5EFFF", color: "#006BCA" }
              : { color: "#60646C", ":hover": { bg: "#f2f0e9" } }),
            fontSize: "94%",
          }}
        >
          {iconComponent}
          <Text sx={isActive ? { fontWeight: 600 } : {}}>{label}</Text>
        </Flex>
      )}
    </NavLink>
  )
}
