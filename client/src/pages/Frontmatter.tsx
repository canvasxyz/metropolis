import React, { useEffect, useState } from "react"
import {remark} from "remark"
import remarkFrontMatter from "remark-frontmatter"
import remarkParseFrontmatter from 'remark-parse-frontmatter'
import { Box } from "theme-ui"

type FrontmatterProps = {source: string}

const useParsedFrontmatter = (source: string) => {
  const [frontmatter, setFrontmatter] = useState<Record<string,any>|null>(null)

  useEffect(() => {
    const proc = remark().use(remarkFrontMatter, {type: "yaml", marker: "-"}).use(remarkParseFrontmatter as any)
    const output = proc.processSync(source)

    setFrontmatter(output.data.frontmatter)

  }, [source])

  return {frontmatter}
}

export const Frontmatter: React.FC<FrontmatterProps> = ({source}) => {
  const {frontmatter} = useParsedFrontmatter(source)

  if(frontmatter == null) return <></>

  return  (
    <Box sx={{ my: [3], px: [3], py: [3], border: "1px solid #ddd" }}>
      {Object.entries(frontmatter).map(([key, value]) =>
        <Box> {key}: {value}</Box>
      )}
    </Box>
  )
}
