import React, { useEffect, useState } from "react"
import {remark} from "remark"
import remarkFrontMatter from "remark-frontmatter"
import remarkParseFrontmatter from 'remark-parse-frontmatter'
import { Box } from "theme-ui"

type FrontmatterProps = {source: string}

const useParsedFrontmatter = (source: string) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error|null>(null)

  const [frontmatter, setFrontmatter] = useState<Record<string,any>|null>(null)

  useEffect(() => {
    // @ts-ignore
    const proc = remark().use(remarkFrontMatter, {type: "yaml", marker: "-"}).use(remarkParseFrontmatter)

    proc.process(source).then(output => {

      setFrontmatter(output.data.frontmatter)
      setLoading(false)
    }).catch(err => {
      setError(err)
      setLoading(false)
    })


  }, [source])

  return {frontmatter, loading, error}
}

export const Frontmatter: React.FC<FrontmatterProps> = ({source}) => {
  const {frontmatter, loading, error} = useParsedFrontmatter(source)

  if (loading) {
    return <Box sx={{ my: [3], px: [3], py: [3], border: "1px solid #ddd" }}>
      Loading...
    </Box>
  }

  if (error) {
    return <Box sx={{ overflowX: "scroll", my: [3], px: [3], py: [3], border: "1px solid #ddd" }}>
      {error.message}
      <pre>{source.split("---")[1]}</pre>
    </Box>
  }
  if (frontmatter === null) {
    return <Box sx={{ my: [3], px: [3], py: [3], border: "1px solid #ddd" }}>
      No frontmatter
    </Box>
  }

  return  (
    <Box sx={{ my: [3], px: [3], py: [3], border: "1px solid #ddd" }}>
      {Object.entries(frontmatter).map(([key, value]) =>
        <Box key={key}> {key}: {JSON.stringify(value)}</Box>
      )}
    </Box>
  )
}
