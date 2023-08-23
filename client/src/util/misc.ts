export const formatTime = (epochTime: number) => {
  const date = new Date(epochTime).getTime()
  const diff = Date.now() - date

  console.log(epochTime, date, diff)

  const minute = 60 * 1000
  const hour = minute * 60
  const day = hour * 24
  const week = day * 7
  const month = day * 30
  const year = day * 365

  if (diff < minute) {
    return "Just now"
  } else if (diff < hour) {
    return Math.floor(diff / minute) + " minutes ago"
  } else if (diff < day) {
    return Math.floor(diff / hour) + " hours ago"
  } else if (diff < week) {
    return Math.floor(diff / day) + " days ago"
  } else if (diff < month) {
    return Math.floor(diff / week) + " weeks ago"
  } else if (diff < year) {
    return Math.floor(diff / month) + " months ago"
  } else {
    return Math.floor(diff / year) + " years ago"
  }
}
