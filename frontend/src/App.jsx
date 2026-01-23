import { MonitorsTable } from "@/components/MonitorsTable"
import { MonitorsDashboard } from "@/components/MonitorsDashboard"

export default function App() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left / Top block */}
      <div className="w-full md:w-1/4 p-4 md:p-6 border-b md:border-b-0 md:border-r">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
          Monitors
        </h1>
      
        <MonitorsDashboard />
      </div>

      {/* Right / Bottom block */}
      <div className="w-full md:flex-1 p-4 md:p-6 overflow-x-auto">
        <MonitorsTable />
      </div>
    </div>
  )
}