"use client";

import { useState } from "react";
import Link from "next/link";

import { useSelector } from "react-redux";
import BuyerProfile from "@/components/buyer/BuyerProfile";
import Orders from "@/components/buyer/orders/Orders";
import UserMessages from "@/components/supplier-buyer/UserMessages";

import {
  Home,
  User,
  ShoppingCart,
  Heart,
  ShoppingBag,
  Mail,
  HelpCircle,
  Menu,
} from "react-feather";

const Dashboard = () => {
  const { user: userData, loading } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState("home");

  const menuItems = [
    { key: "home", label: "Home", icon: <Home size={18} /> },
    { key: "profile", label: "Profile", icon: <User size={18} /> },
    { key: "orders", label: "Orders", icon: <ShoppingCart size={18} /> },
    { key: "wishlist", label: "Wishlist", icon: <Heart size={18} /> },
    { key: "cart", label: "Cart", icon: <ShoppingBag size={18} /> },
    { key: "messages", label: "Messages", icon: <Mail size={18} /> },
    { key: "support", label: "Support", icon: <HelpCircle size={18} /> },
  ];

  const renderContent = () => {
    switch (selectedPage) {
      case "home":
        return (
          <div>
            <h2 className='text-2xl font-bold text-primary'>
              Welcome, {userData?.name || "Buyer"}!
            </h2>
            <p className='text-gray-600 mt-2'>
              Manage your orders, wishlist, and profile all in one place.
            </p>
          </div>
        );
      case "profile":
        return <BuyerProfile />;
      case "orders":
        return <Orders />;
      case "messages":
        return <UserMessages />;
      case "wishlist":
        return (
          <div>
            <h2 className='text-xl font-semibold text-primary'>Wishlist</h2>
            <p className='text-gray-600 mt-2'>Items you’ve saved for later.</p>
          </div>
        );
      case "cart":
        return (
          <div>
            <h2 className='text-xl font-semibold text-primary'>
              Shopping Cart
            </h2>
            <p className='text-gray-600 mt-2'>
              View and manage items in your cart.
            </p>
          </div>
        );
      case "support":
        return (
          <div>
            <h2 className='text-xl font-semibold text-primary'>Support</h2>
            <p className='text-gray-600 mt-2'>
              Need help? Reach out to our support team.
            </p>
          </div>
        );
      default:
        return (
          <h2 className='text-xl font-semibold text-red-500'>Page Not Found</h2>
        );
    }
  };

  return (
    <div className='min-h-screen flex flex-col lg:flex-row bg-gray-50'>
      {/* Mobile Header */}
      <div className='flex items-center justify-between p-4 bg-white shadow-md lg:hidden'>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className='text-primary'
        >
          <Menu />
        </button>
        <h1 className='text-lg font-semibold text-primary'>Buyer Dashboard</h1>
        <img
          src={userData?.logoUrl || "https://via.placeholder.com/32"}
          alt='User Avatar'
          className='w-10 h-10 rounded-full object-cover'
        />
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "block" : "hidden"
        } lg:block w-full lg:w-64 bg-white border-r shadow-md`}
      >
        <nav className='flex flex-col py-6'>
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setSelectedPage(item.key);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                selectedPage === item.key
                  ? "text-primary font-bold"
                  : "text-gray-700 hover:text-primary"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className='flex-1 p-4 md:p-8'>
        <div className='bg-white rounded-lg shadow-md p-6'>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
