import {} from "react"
import { ThemeUIStyleObject } from "theme-ui"

declare module "*.md"

declare module "react" {
  interface Attributes {
    sx?: ThemeUIStyleObject
    noreferrer?: "noreferrer"
    noopener?: "noopener"
  }
}
