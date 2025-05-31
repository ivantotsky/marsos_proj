"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  User,
  FileText,
  Users,
  Mail,
  Package,
  ShoppingCart,
  ClipboardList,
  Settings,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SupplierSidebarLayout({ children }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const menuItems = [
    { key: "dashboard", href: "/supplier-dashboard", icon: LayoutDashboard },
    { key: "profile", href: "/supplier-dashboard/profile", icon: User },
    { key: "terms", href: "/supplier-dashboard/terms", icon: FileText },
    { key: "employees", href: "/supplier-dashboard/employees", icon: Users },
    { key: "messages", href: "/supplier-dashboard/messages", icon: Mail },
    { key: "products", href: "/supplier-dashboard/products", icon: Package },
    { key: "orders", href: "/supplier-dashboard/orders", icon: ShoppingCart },
    { key: "rfqs", href: "/supplier-dashboard/rfqs", icon: ClipboardList },
    { key: "settings", href: "/supplier-dashboard/settings", icon: Settings },
    { key: "support", href: "/supplier-dashboard/support", icon: HelpCircle },
  ];

  return (
    <div className='flex flex-col md:flex-row min-h-screen bg-gray-50 relative'>
      {/* Desktop sidebar */}
      <aside className='hidden md:block w-64 bg-white border-r p-6'>
        <h2 className='text-lg font-bold mb-6 text-[#2c6449]'>
          {t("sidebar.title")}
        </h2>
        <nav className='space-y-1'>
          {menuItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all",
                pathname === item.href
                  ? "bg-[#e4f4ec] text-[#2c6449] font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <item.icon className='h-4 w-4' />
              {t(`sidebar.${item.key}`)}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile header */}
      <div className='md:hidden w-full bg-white border-b px-4 py-3 flex items-center justify-between'>
        <button onClick={() => setOpen(true)} className='text-[#2c6449]'>
          <Menu className='h-5 w-5' />
        </button>
        <h2 className='text-sm font-semibold text-[#2c6449]'>
          {t("sidebar.title")}
        </h2>
        <div />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className='absolute top-0 left-0 w-full z-30 flex md:hidden'>
          <div className='w-64 h-screen bg-white p-6 shadow-lg'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-lg font-bold text-[#2c6449]'>
                {t("sidebar.menu")}
              </h2>
              <button onClick={() => setOpen(false)}>
                <X className='h-5 w-5 text-gray-500' />
              </button>
            </div>
            <nav className='space-y-2'>
              {menuItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all",
                    pathname === item.href
                      ? "bg-[#e4f4ec] text-[#2c6449] font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className='h-4 w-4' />
                  {t(`sidebar.${item.key}`)}
                </Link>
              ))}
            </nav>
          </div>
          <div
            className='flex-1 bg-black/30 backdrop-blur-sm'
            onClick={() => setOpen(false)}
          />
        </div>
      )}

      {/* Content */}
      <main className='flex-1 p-4 sm:p-6 md:pt-6'>{children}</main>
    </div>
  );
}
