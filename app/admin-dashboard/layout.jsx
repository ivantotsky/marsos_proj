"use client";

import RequireAuth from "@/components/RequireAuth";
import AdminSidebarLayout from "@/components/admin/AdminSidebarLayout";

export default function AdminDashboardLayout({ children }) {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <AdminSidebarLayout>{children}</AdminSidebarLayout>
    </RequireAuth>
  );
}
