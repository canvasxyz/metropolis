import React, { useEffect, useState } from "react"
import { Link as RouterLink } from "react-router-dom"
import { toast } from "react-hot-toast"

import { formatTimeAgo } from "../../util/misc"
import Spinner from "../../components/spinner"
import api from "../../util/api"
import ConversationsList from "./conversations_list"
import { BiSolidBarChartAlt2 } from "react-icons/bi"
import { ListingSelector } from "./listing_selector"
import { Box, Flex, Text, Link } from "theme-ui"
import { TbFocus } from "react-icons/tb"

const LogoBlock = () => {
  return (
    <Flex sx={{gap: 2}}>
      <img
        src="/filecoin.png"
        width="25"
        height="25"
      />
      <Text
        variant="links.text"
        sx={{
          color: "text",
          "&:hover": { color: "text" },
          fontWeight: 700,

        }}
      >
        Fil Poll
      </Text>
    </Flex>
  )
}

const LastSync = ({ lastSync, syncInProgress, syncPRs }: { lastSync: number; syncInProgress: boolean; syncPRs: () => void }) => {
  return <Box
    sx={{
      position: "absolute",
      bottom: "0px",
      pb: "86px",
      pt: "20px",
      fontSize: "0.88em",
      textAlign: "center",
      width: "100%",
      color: "#83817d",
      background:
        "linear-gradient(0deg, #faf9f6 0%, #faf9f6 66%, #faf9f699 88%, transparent)",
    }}
  >
    Last sync: {isNaN(lastSync) ? "n/a" : formatTimeAgo(lastSync)} &nbsp;
    <Link variant="links.a" onClick={() => syncPRs()}>
      {syncInProgress ? <Spinner size={26} /> : `Sync now`}
    </Link>
  </Box>
}


const Sidebar = ({mobileMenuOpen}: {mobileMenuOpen: boolean}) => {
  const [syncInProgress, setSyncInProgress] = useState(false)
  const [lastSync, setLastSync] = useState<number>()

  useEffect(() => {
    api.get("/api/v3/github_syncs", {}).then((result) => {
      if (!result.success) return
      const lastSync = Date.parse(result.latest.ts)
      setLastSync(lastSync)
    })
  }, [])

  const syncPRs = () => {
    // github sync
    setSyncInProgress(true)
    toast.success("Connecting to Github...")
    api
      .post("api/v3/github_sync", {})
      .then(({ existingFips, openPulls, fipsUpdated, fipsCreated }) => {
        toast.success(`Downloading ${existingFips} FIPs, ${openPulls} open PRs...`)
        setTimeout(() => {
          toast.success(`Updating ${fipsUpdated} FIPs, creating ${fipsCreated} new FIPs...`)
          setTimeout(() => {
            document.location.reload()
          }, 2000)
        }, 2000)
      })
      .fail((error) => {
        toast.error("Sync error")
        console.error(error)
      })
      .always(() => {
        setSyncInProgress(false)
      })
  }

  return <Box
    sx={{
      display: mobileMenuOpen ? null : ["none", "block"],
      width: ["100%", "40%", null, "340px"],
      borderRight: "1px solid #e2ddd5",
      bg: "#FFFFFF",
      maxHeight: "100vh",
      overflow: "hidden",
      position: "relative",
    }}
  >
    <Flex
      sx={{
        width: "100%",
        borderBottom: "1px solid #e2ddd5",
        pt: "7px",
        pb: "14px",
        px: "18px",
        alignItems: "center",
        whiteSpace: "nowrap",
      }}
    >
      <Box sx={{ flexGrow: "1" }}>
        <RouterLink to="/dashboard">
          <LogoBlock />
        </RouterLink>
      </Box>
    </Flex>
    <ListingSelector
      to="/dashboard/sentiment_checks"
      iconType={BiSolidBarChartAlt2}
      label="Sentiment Checks"
    />
    <ListingSelector to="/dashboard/fip_tracker" iconType={TbFocus} label="FIP Tracker" />
    <ConversationsList />
    <LastSync lastSync={lastSync} syncInProgress={syncInProgress} syncPRs={syncPRs} />
  </Box>
}

export default Sidebar
