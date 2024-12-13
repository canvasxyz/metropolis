import React from "react"
import { Text, Flex } from "@radix-ui/themes"

class NumberCard extends React.Component<
  {
    datum: number | string
    subheading: string
  },
  {}
> {
  render() {
    return (
      <Flex my="2">
        <Text weight="bold" mr="2">{this.props.datum}</Text>
        <Text> {this.props.subheading} </Text>
      </Flex>
    )
  }
}

export default NumberCard
