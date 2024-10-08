import _ from "underscore"

type PolisTypes = {
  reactions: Reactions
  staractions: StarActions
  mod: Mod
  reactionValues?: any
  starValues?: any
}

type Reactions = {
  push: number
  pull: number
  see: number
  pass: number
}

type StarActions = {
  unstar: number
  star: number
}

type Mod = {
  ban: number
  unmoderated: number
  ok: number
}

function strToHex(str: string) {
  let hex, i
  // let str = "\u6f22\u5b57"; // "\u6f22\u5b57" === "漢字"
  let result = ""
  for (i = 0; i < str.length; i++) {
    hex = str.charCodeAt(i).toString(16)
    result += ("000" + hex).slice(-4)
  }
  return result
}

function hexToStr(hexString: string) {
  let j
  let hexes = hexString.match(/.{1,4}/g) || []
  let str = ""
  for (j = 0; j < hexes.length; j++) {
    str += String.fromCharCode(parseInt(hexes[j], 16))
  }
  return str
}

let polisTypes: PolisTypes = {
  reactions: {
    push: 1,
    pull: -1,
    see: 0,
    pass: 0,
  },
  staractions: {
    unstar: 0,
    star: 1,
  },
  mod: {
    ban: -1,
    unmoderated: 0,
    ok: 1,
  },
}
polisTypes.reactionValues = _.values(polisTypes.reactions)
polisTypes.starValues = _.values(polisTypes.staractions)

export { strToHex, hexToStr, polisTypes }

export default { strToHex, hexToStr, polisTypes }
