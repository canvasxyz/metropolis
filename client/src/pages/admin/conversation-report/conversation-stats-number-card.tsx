import React from "react"
import { Text, Flex } from "theme-ui"

class NumberCard extends React.Component<
  {
    datum: number | string
    subheading: string
  },
  {}
> {
  render() {
    return (
      <Flex sx={{ my: [2] }}>
        <Text sx={{ fontWeight: 700, mr: [2] }}>{this.props.datum}</Text>
        <Text> {this.props.subheading} </Text>
      </Flex>
    )
  }
}

export default NumberCard
