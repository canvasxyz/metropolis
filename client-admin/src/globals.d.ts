import {} from 'react'
import { ThemeUIStyleObject } from 'theme-ui'

declare module "*.md";

declare namespace FB {
  const api: any
  const login: any
}

declare module 'react' {
  interface Attributes {
    sx?: ThemeUIStyleObject
  }
}
