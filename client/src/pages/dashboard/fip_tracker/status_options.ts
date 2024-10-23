import { labelPadding } from "../../report/components/globals"

export const statusOptions = {
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
    color: "slate",
  },
}
