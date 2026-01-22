import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { useState, useEffect } from "react";

export function MonitorsTable() {
  const [monitors, setMonitors] = useState([]);

  useEffect(() => {
    async function fetchMonitors() {
      try {
        const response = await fetch("/api/monitors");
        const data = await response.json();
        console.log("Monitors from backend:", data);
        setMonitors(data);
      } catch (error) {
        console.error("Failed to fetch monitors:", error);
      }
    }

    fetchMonitors();
  }, []);

  function updateMonitorStatus(id, status) {
    setMonitors(monitors.map(m =>
      m.id === id
        ? {
            ...m,
            status,
            lastCheck: new Date().toLocaleString()
          }
        : m
    ));
  }

  return (
    <Table className="rounded-lg overflow-hidden">
      {/* Заголовок таблицы */}
      <TableHeader className="bg-muted">
        <TableRow>
          <TableHead className="w-12 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            #
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            URLs
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Last check
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-center">
            Response time
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-center">
            Check interval
          </TableHead>
        </TableRow>
      </TableHeader>

      {/* Тело таблицы */}
      <TableBody className="border-b border-border">
        {monitors.map((monitor, index) => (
          <MonitorRow
            key={monitor.id}
            monitor={monitor}
            index={index}
          />
        ))}
      </TableBody>
    </Table>
  )
}

function MonitorRow({ monitor, index }) {
  return (
    <TableRow
      className={`transition
        ${monitor.status === "up"
          ? "bg-green-50 hover:bg-green-100"
          : "bg-red-50 hover:bg-red-100"
        }
     `}
    >

      {/* № */}
      <TableCell className="text-muted-foreground">
        {index + 1}
      </TableCell>

      {/* URL */}
      <TableCell>
        <span className="font-mono text-foreground">
          {monitor.url}
        </span>
      </TableCell>

      {/* Status */}
      <TableCell>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium
            ${
              monitor.status === "up"
                ? "bg-green-100 text-green-700"
               : "bg-red-100 text-red-700"
            }
         `}
        >
          {monitor.status}
        </span>
      </TableCell>
      {/* Last check */}
      <TableCell className="text-sm text-muted-foreground">
        {monitor.lastCheck ? monitor.lastCheck : "—"}
      </TableCell>
      {/* Response time */}
      <TableCell className="text-sm text-muted-foreground text-center">
        {monitor.responseTime ? `${monitor.responseTime} ms` : "—"}
      </TableCell>
      {/* Сheck interval */}
      <TableCell className="text-sm text-muted-foreground text-center">
        {monitor.interval}
      </TableCell>
    </TableRow>
  );
}