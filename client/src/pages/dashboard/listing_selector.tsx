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
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <Flex
          sx={{
            mx: 2,
            my: "2px",
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
          {iconType({
            size: "1.5em",
            style: { position: "relative", top: 0, marginLeft: "3px", opacity: isActive ? 1 : 0.8 },
          })}
          <Text sx={isActive ? { fontWeight: 600 } : {}}>{label}</Text>
        </Flex>
      )}
    </NavLink>
  )
}
