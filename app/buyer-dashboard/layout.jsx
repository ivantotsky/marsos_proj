// app/buyer-dashboard/layout.jsx
"use client";

import RequireAuth from "@/components/RequireAuth";

export default function BuyerDashboardLayout({ children }) {
  return <RequireAuth>{children}</RequireAuth>;
}
