"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Package,
  Users,
  Settings,
  MessageSquare,
  ShoppingBag,
  BarChart,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminSidebarLayout({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const [ordersOpen, setOrdersOpen] = useState(
    pathname.startsWith("/admin-dashboard/orders")
  );
  const [productsOpen, setProductsOpen] = useState(
    pathname.startsWith("/admin-dashboard/products")
  );
  const [usersOpen, setUsersOpen] = useState(
    pathname.startsWith("/admin-dashboard/users")
  );
  const [marketingOpen, setMarketingOpen] = useState(
    pathname.startsWith("/admin-dashboard/marketing")
  );

  const SidebarNav = () => (
    <nav className='space-y-1'>
      <Link
        href='/admin-dashboard'
        onClick={() => setOpen(false)}
        className={navLink("/admin-dashboard")}
      >
        <Home className='h-4 w-4' />
        Dashboard
      </Link>

      {/* Orders */}
      {expandableNav("Orders", ShoppingBag, ordersOpen, setOrdersOpen, [
        ["/admin-dashboard/orders", "Orders"],
        ["/admin-dashboard/orders/transactions", "Transactions"],
        ["/admin-dashboard/orders/abandon-carts", "Abandon Carts"],
      ])}

      {/* Products */}
      {expandableNav("Products", Package, productsOpen, setProductsOpen, [
        ["/admin-dashboard/products", "Product List"],
        ["/admin-dashboard/products/category", "Product Category"],
      ])}

      {/* Users */}
      {expandableNav("Users", Users, usersOpen, setUsersOpen, [
        ["/admin-dashboard/users/admins", "Admins"],
        ["/admin-dashboard/users/suppliers", "Suppliers"],
        ["/admin-dashboard/users/buyers", "Buyers"],
      ])}

      <Link
        href='/admin-dashboard/messages'
        onClick={() => setOpen(false)}
        className={navLink("/admin-dashboard/messages")}
      >
        <MessageSquare className='h-4 w-4' />
        Messages
      </Link>

      {/* Marketing */}
      {expandableNav("Marketing", BarChart, marketingOpen, setMarketingOpen, [
        ["/admin-dashboard/marketing/seo", "SEO"],
        ["/admin-dashboard/marketing/promotion", "Promotion"],
        ["/admin-dashboard/marketing/coupons", "Coupon Code"],
      ])}

      <Link
        href='/admin-dashboard/settings'
        onClick={() => setOpen(false)}
        className={navLink("/admin-dashboard/settings")}
      >
        <Settings className='h-4 w-4' />
        Settings
      </Link>
    </nav>
  );

  const pathnameMatch = (href) => pathname === href;
  const navLink = (href) =>
    cn(
      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
      pathnameMatch(href)
        ? "bg-[#e4f4ec] text-[#2c6449]"
        : "text-gray-700 hover:bg-gray-100"
    );

  const expandableNav = (title, Icon, openState, setOpenState, links) => (
    <div>
      <button
        onClick={() => setOpenState(!openState)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
          links.some(([href]) => pathname.startsWith(href))
            ? "bg-[#e4f4ec] text-[#2c6449]"
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        <span className='flex items-center gap-3'>
          <Icon className='h-4 w-4' />
          {title}
        </span>
        {openState ? (
          <ChevronDown className='h-4 w-4' />
        ) : (
          <ChevronRight className='h-4 w-4' />
        )}
      </button>
      {openState && (
        <div className='ml-8 mt-1 space-y-1'>
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-3 py-1.5 text-sm rounded-md",
                pathnameMatch(href)
                  ? "bg-[#e4f4ec] text-[#2c6449]"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className='flex flex-col md:flex-row min-h-screen bg-gray-50 relative'>
      {/* Desktop Sidebar */}
      <aside className='hidden md:block w-64 bg-white border-r px-6 py-8'>
        <h2 className='text-xl font-bold mb-8 text-[#2c6449]'>Admin Panel</h2>
        <SidebarNav />
      </aside>

      {/* Mobile Top Bar */}
      <div className='md:hidden w-full bg-white border-b z-10 flex items-center justify-between px-4 py-3 shadow-sm'>
        <button onClick={() => setOpen(true)} className='text-[#2c6449]'>
          <Menu className='h-6 w-6' />
        </button>
        <h1 className='text-lg font-semibold text-[#2c6449]'>Dashboard</h1>
        <div />
      </div>

      {/* Mobile Sidebar Drawer Inside Container */}
      {open && (
        <div className='absolute top-0 left-0 w-full z-30 flex md:hidden'>
          <div className='w-64 h-screen bg-white px-6 py-8 shadow-lg'>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-xl font-bold text-[#2c6449]'>Admin Panel</h2>
              <button onClick={() => setOpen(false)}>
                <X className='h-5 w-5 text-gray-500' />
              </button>
            </div>
            <SidebarNav />
          </div>
          <div
            className='flex-1 bg-black/30 backdrop-blur-sm'
            onClick={() => setOpen(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <main className='flex-1 px-4 py-6 md:px-10 md:py-8'>{children}</main>
    </div>
  );
}
