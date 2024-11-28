// from https://stackoverflow.com/a/26989421
// eslint-disable-next-line no-empty-character-class
const EMAIL_REGEX = /([!#-'*+/-9=?A-Z^-~-]+(\.[!#-'*+/-9=?A-Z^-~-]+)*|"([]!#-[^-~ \t]|(\\[\t -~]))+")@([!#-'*+/-9=?A-Z^-~-]+(\.[!#-'*+/-9=?A-Z^-~-]+)*|\[[\t -Z^-~]*])/

export type UserInfo = {
  name?: string,
  email?: string,
  username?: string
}

type ParseResult<T> = {
  result: "success",
  payload: T
} | {
  result: "failure"
} | {
  result: "skip"
}

function parseLine(line) {
  if(line.length === 0) {
    return {
      result: "skip" as const
    }
  }

  // remove all quotes
  const cleanedLine = line.replace(
    "<a list of the author's or authors' name(s) and/or username(s), or name(s) and email(s), e.g. (use with the parentheses or triangular brackets):",
    "",
  ).replace("\"", "").replace("\"", "").replace("(", " (")

  const namesFromLineWithSpaces = parseLineWithDelimiter(cleanedLine, " ")
  if (namesFromLineWithSpaces.result === "success") {
    return {
      result: "success" as const,
      payload: namesFromLineWithSpaces.payload
    }
  }

  const namesFromLineWithCommas = parseLineWithDelimiter(cleanedLine, ",")
  if (namesFromLineWithCommas.result === "success") {
    return {
      result: "success" as const,
      payload: namesFromLineWithCommas.payload
    }
  }

  return {
    result: "failure" as const
  }
}

function parseLineWithDelimiter(line, delimiter): ParseResult<UserInfo[]> {
  // try splitting by spaces
  const parsedParts: UserInfo[] = []
  for(const linePart of line.split(delimiter)) {
    const res = parseLinePart(linePart)
    if(res.result === "failure") {
      // cannot parse part of this line - maybe the names aren't separated by `delimiter`
      return {
        result: "failure" as const
      }
    } else if(res.result === "skip") {
      continue
    } else {
      parsedParts.push(res.payload)
    }
  }

  return {
    result: "success",
    payload: parsedParts
  }
}

function parseLinePart(part: string): ParseResult<{name?: string, email?: string, username?: string}> {
  // trim spaces from either end of name
  part = part.trim()

  const nameAndSomethingRegex = /(.+)[<(](.+)[>)]/
  const nameAndSomethingRegexMatch = part.match(nameAndSomethingRegex)
  if(nameAndSomethingRegexMatch)  {
    const name = nameAndSomethingRegexMatch[1].replace(/^and /, "").replace(/^@/, "").trim() as string
    const usernameOrEmail = nameAndSomethingRegexMatch[2].trim() as string
    if(usernameOrEmail.match(EMAIL_REGEX)) {
      return {
        result: "success",
        payload: {
          name,
          email: usernameOrEmail
        }
      }
    } else {
      return {
        result: "success",
        payload: {
          name,
          username: usernameOrEmail.replace(/^@/, "").trim()
        }
      }
    }
  }

  // first part of the name shouldn't have a < or (
  const firstChar = part[0]
  const lastChar = part[part.length - 1]
  if(firstChar === "(" || firstChar === "<" || lastChar === ")" || lastChar === ">" || lastChar === ",") {
    return {
      result: "failure"
    }
  }

  const usernameRegex = /@(.+)/
  const usernameRegexMatch = part.match(usernameRegex)
  if(usernameRegexMatch)  {
    return {
      result: "success",
      payload: {
        username: usernameRegexMatch[1].trim()
      }
    }
  }

  if(part === "..." || part === "et al." || part === "") {
    return {
      result: "skip"
    }
  }

  return {
    result: "success",
    payload: {
      username: part
    }
  }
}


export function splitAuthors(fip_authors) {
  const result = parseLine(fip_authors)

  if(result.result === "success") return result.payload

  return null
}

export function getAuthorKey(author: UserInfo) {
  let key: string
  if(author.username){
    key = `username:${author.username.toLowerCase()}`
  } else if (author.email){
    key = `email:${author.email.toLowerCase()}`
  } else {
    key = `name:${author.name.toLowerCase()}`
  }
  return key
}
