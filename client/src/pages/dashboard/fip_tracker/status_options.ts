type Color = "gray" | "gold" | "bronze" | "brown" | "yellow" | "amber" | "orange" | "tomato" | "red" | "ruby" | "crimson" | "pink" | "plum" | "purple" | "violet" | "iris" | "indigo" | "blue" | "cyan" | "teal" | "jade" | "green" | "grass" | "lime" | "mint" | "sky"
export const statusOptions: Record<string, {label: string, color: Color }> = {
  draft: {
    label: "Draft",
    color: "gray",
  },
  "last-call": {
    label: "Last Call",
    color: "amber",
  },
  accepted: {
    label: "Accepted",
    color: "green",
  },
  final: {
    label: "Final",
    color: "violet",
  },
  active: {
    label: "Active",
    color: "sky",
  },
  deferred: {
    label: "Deferred",
    color: "yellow",
  },
  rejected: {
    label: "Rejected",
    color: "red",
  },
  superseded: {
    label: "Superseded",
    color: "pink",
  },
  unknown: {
    label: "Unknown",
    color: "gray",
  },
  closed: {
    label: "Closed",
    color: "red",
  }
}
