import RequireAuth from "@/components/RequireAuth";
import SupplierSidebarLayout from "@/components/supplier/SupplierSidebarLayout";

export default function SupplierDashboardLayout({ children }) {
  return (
    <RequireAuth>
      <SupplierSidebarLayout>{children}</SupplierSidebarLayout>
    </RequireAuth>
  );
}
