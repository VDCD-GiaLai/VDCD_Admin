"use client";

import { StatsCards } from "./StatsCards";
import { LeadTrendChart } from "./LeadTrendChart";
import { QuickLinks } from "./QuickLinks";
import { DraftContentTable } from "./DraftContentTable";

export function SuperadminDashboard() {
  return (
    <>
      <StatsCards />

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LeadTrendChart />
        </div>
        <div>
          <QuickLinks />
        </div>
      </div>

      <div className="mb-6">
        <DraftContentTable />
      </div>
    </>
  );
}
