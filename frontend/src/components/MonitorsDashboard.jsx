import { useEffect, useState } from "react"

export function MonitorsDashboard() {
  const [monitors, setMonitors] = useState([])

  useEffect(() => {
    async function fetchMonitors() {
      try {
        const response = await fetch("/api/monitors")
        const data = await response.json()
        setMonitors(data)
      } catch (error) {
        console.error("Failed to fetch monitors:", error)
      }
    }

    fetchMonitors()
  }, [])

  const upCount = monitors.filter(m => m.status === "up").length
  const downCount = monitors.filter(m => m.status === "down").length
  const total = monitors.length

  const allUp = total > 0 && downCount === 0

  return (
    <div>
      {/* Status block */}
      {allUp ? (
        <div className="rounded-lg bg-green-100 text-green-800 p-4">
          <div className="text-sm font-medium">Current status</div>
          <div className="text-lg font-semibold">All monitors running</div>
        </div>
      ) : (
        <div className="rounded-lg bg-red-100 text-red-800 p-4">
          <div className="text-sm font-medium">Current status</div>
          <div className="text-sm">Up: {upCount}</div>
          <div className="text-sm">Down: {downCount}</div>
        </div>
      )}
    </div>
  )
}
