import {} from "react"

declare module "*.md"

declare module "react" {
  interface Attributes {
    noreferrer?: "noreferrer"
    noopener?: "noopener"
  }
}
