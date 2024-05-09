export const formatTimeAgo = (epochTime: number, short?: boolean) => {
  const date = new Date(epochTime).getTime()
  const diff = Date.now() - date

  const minute = 60 * 1000
  const hour = minute * 60
  const day = hour * 24
  const week = day * 7
  const month = day * 30
  const year = day * 365

  if (diff < minute) {
    return "Just now"
  } else if (diff < hour) {
    const val = Math.floor(diff / minute)
    return val + (short ? `min` : ` minute${val === 1 ? "" : "s"} ago`)
  } else if (diff < day) {
    const val = Math.floor(diff / hour)
    return val + (short ? `h` : ` hour${val === 1 ? "" : "s"} ago`)
  } else if (diff < week) {
    const val = Math.floor(diff / day)
    return val + (short ? `d` : ` day${val === 1 ? "" : "s"} ago`)
  } else if (diff < month) {
    const val = Math.floor(diff / week)
    return val + (short ? `w` : ` week${val === 1 ? "" : "s"} ago`)
  } else if (diff < year) {
    const val = Math.floor(diff / month)
    return val + (short ? `mo` : ` month${val === 1 ? "" : "s"} ago`)
  } else {
    const val = Math.floor(diff / year)
    return val + (short ? `y` : ` year${val === 1 ? "" : "s"} ago`)
  }
}
