import { MonitorsTable } from "@/components/MonitorsTable"

export default function App() {
  return (
    <div className="min-h-screen flex">
      {/* left quarter */}
      <div className="w-1/4 p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
          Monitors
        </h1>
      </div>

      {/* Right side (2/3 of the screen) */}
      <div className="flex-1 p-6">
        <MonitorsTable />
      </div>
    </div>
  )
}