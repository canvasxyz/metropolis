import {} from "react"
import { ThemeUIStyleObject } from "theme-ui"

declare module "*.md"

declare namespace FB {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const api: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const login: any
}

declare module "react" {
  interface Attributes {
    sx?: ThemeUIStyleObject
    noreferrer?: "noreferrer"
    noopener?: "noopener"
  }
}
