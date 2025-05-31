"use client";

import React, { useState, useEffect } from "react";
// Firestore methods
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
// Next.js navigation
import { useRouter } from "next/navigation";
// Your Firebase config
import { db } from "@/firebase/config";
// Pull directly from Redux instead of a custom hook
import { useSelector } from "react-redux";
// Excel export library
import * as XLSX from "xlsx";
// i18n translation
import { useTranslation } from "react-i18next";
// Toast notifications
import { toast } from "sonner";
// Icons
import { Download, Trash2, Pencil } from "lucide-react";

// Helper to show success toasts
const showSuccess = (msg) => toast.success(msg);
// Helper to show error toasts
const showError = (msg) => toast.error(msg);

export default function Products() {
  const router = useRouter();
  const { i18n, t } = useTranslation();

  // —————————————
  // 1️⃣ Read auth state from Redux
  // —————————————
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const role = user?.role; // user.role or undefined
  const hasRole = (r) => role === r; // helper to check any role

  // —————————————
  // 2️⃣ Local UI state
  // —————————————
  const [productData, setProductData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTab, setSelectedTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [filterType, setFilterType] = useState("manual");
  const [searchTerm, setSearchTerm] = useState("");

  // —————————————
  // 3️⃣ Redirect non-admins once auth resolves
  // —————————————
  useEffect(() => {
    if (!authLoading && !hasRole("admin")) {
      // If finished loading and not an admin, send to login
      router.replace("/admin-login");
    }
  }, [authLoading, role, router]);

  // —————————————
  // 4️⃣ Fetch products ONLY for admins
  // —————————————
  useEffect(() => {
    // don’t fetch while loading or if not admin
    if (authLoading || !hasRole("admin")) return;

    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, "products"));
        const prods = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProductData(prods);

        // derive unique categories for tabs
        setCategories([
          "All",
          ...new Set(prods.map((p) => p.category || "Uncategorized")),
        ]);
      } catch (err) {
        console.error(err);
        showError(t("admin_products.failed_to_load"));
      }
    };

    fetchProducts();
  }, [authLoading, role, t]);

  // —————————————
  // 5️⃣ Handlers: delete, search, reset
  // —————————————
  const handleDelete = async (id) => {
    if (!confirm(t("admin_products.confirm_delete"))) return;
    try {
      await deleteDoc(doc(db, "products", id));
      setProductData((prev) => prev.filter((p) => p.id !== id));
      showSuccess(t("admin_products.deleted_success"));
    } catch {
      showError(t("admin_products.delete_failed"));
    }
  };

  const handleSearch = () => {
    let filtered = [...productData];

    // text search across name, sku, supplier
    if (searchTerm) {
      filtered = filtered.filter((p) => {
        const name =
          typeof p.productName === "object"
            ? p.productName[i18n.language] || p.productName.en
            : p.productName;
        return `${name} ${p.sku} ${p.supplierName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      });
    }

    // sort or filter by the chosen filterType
    if (filterType === "manual") {
      filtered = filtered.filter((p) => p.mainLocation);
    } else if (filterType === "price") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (filterType === "quantity") {
      filtered.sort((a, b) => a.quantity - b.quantity);
    }

    setProductData(filtered);
  };

  const resetSearch = async () => {
    setSearchTerm("");
    setFilterType("manual");
    try {
      const snap = await getDocs(collection(db, "products"));
      setProductData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      showError(t("admin_products.reset_failed"));
    }
  };

  // —————————————
  // 6️⃣ Tabs & Pagination logic
  // —————————————
  const filteredProducts =
    selectedTab === "All"
      ? productData
      : productData.filter(
          (p) =>
            (p.category || "Uncategorized").toLowerCase() ===
            selectedTab.toLowerCase()
        );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // —————————————
  // 7️⃣ Export to Excel
  // —————————————
  const handleExportToExcel = () => {
    if (!productData.length) {
      showError(t("admin_products.no_data"));
      return;
    }
    const rows = productData.map((p) => ({
      ID: p.id,
      "Product Name":
        typeof p.productName === "object"
          ? p.productName[i18n.language] || p.productName.en
          : p.productName,
      "Supplier Name": p.supplierName,
      Location: p.mainLocation,
      Price: p.price,
      Quantity: p.quantity,
      Category: p.category,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "products_export.xlsx");
    showSuccess(t("admin_products.export_success"));
  };

  // —————————————
  // 8️⃣ While auth is loading, show a loader
  // —————————————
  if (authLoading) {
    return <p className='text-center py-6'>{t("admin_products.loading")}</p>;
  }

  // by this point we know isAdmin, so render the table
  return (
    <div className='p-4 max-w-screen-xl mx-auto'>
      {/* Header */}
      <h2 className='text-xl font-bold text-green-600 mb-2'>
        {t("admin_products.title")}
      </h2>
      <p className='text-gray-600 text-sm mb-4'>
        {t("admin_products.subtitle")}
      </p>

      {/* Filters */}
      <div className='flex flex-wrap gap-2 mb-4 text-sm'>
        <select
          className='border rounded px-2 py-1'
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            handleSearch();
          }}
        >
          <option value='manual'>{t("admin_products.location")}</option>
          <option value='price'>{t("admin_products.price")}</option>
          <option value='quantity'>{t("admin_products.quantity")}</option>
        </select>
        <input
          type='text'
          placeholder={t("admin_products.search_placeholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='border px-2 py-1 rounded w-full sm:w-64'
        />
        <button
          onClick={handleSearch}
          className='bg-blue-600 text-white px-3 py-1 rounded'
        >
          {t("admin_products.search_button")}
        </button>
        <button
          onClick={resetSearch}
          className='bg-gray-500 text-white px-3 py-1 rounded'
        >
          {t("admin_products.reset_button")}
        </button>
      </div>

      {/* Export & Add */}
      <div className='flex justify-between items-center mb-4 text-sm'>
        <button
          onClick={handleExportToExcel}
          className='flex items-center gap-2 border border-blue-600 text-blue-600 px-3 py-1 rounded'
        >
          <Download size={16} />
          {t("admin_products.export_to_excel")}
        </button>
        <button
          onClick={() => router.push("/admin-dashboard/products/add")}
          className='bg-green-600 text-white px-3 py-1 rounded'
        >
          {t("admin_products.add_new")}
        </button>
      </div>

      {/* Category Tabs */}
      <div className='flex flex-wrap gap-2 mb-4'>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedTab(cat);
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded text-sm border ${
              selectedTab === cat
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {cat} (
            {cat === "All"
              ? productData.length
              : productData.filter((p) => p.category === cat).length}
            )
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div className='overflow-x-auto'>
        <table className='min-w-full text-sm text-left'>
          <thead className='bg-gray-100 text-gray-600'>
            <tr>
              <th className='p-2'>#</th>
              <th className='p-2'>{t("admin_products.column_name")}</th>
              <th className='p-2'>{t("admin_products.column_supplier")}</th>
              <th className='p-2'>{t("admin_products.column_location")}</th>
              <th className='p-2'>{t("admin_products.column_qty_price")}</th>
              <th className='p-2'>{t("admin_products.column_actions")}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((p, idx) => (
              <tr key={p.id} className='border-b hover:bg-gray-50'>
                <td className='p-2'>
                  {(currentPage - 1) * itemsPerPage + idx + 1}
                </td>
                <td className='p-2'>
                  {typeof p.productName === "object"
                    ? p.productName[i18n.language] || p.productName.en
                    : p.productName}
                </td>
                <td className='p-2'>{p.supplierName}</td>
                <td className='p-2'>{p.mainLocation}</td>
                <td className='p-2'>
                  {p.priceRanges?.map((r, i) => (
                    <div key={i}>
                      {r.minQty}–{r.maxQty} @ {r.price} SAR
                    </div>
                  )) || "N/A"}
                </td>
                <td className='p-2 flex gap-2'>
                  <button
                    onClick={() =>
                      router.push(`/admin-dashboard/products/edit/${p.id}`)
                    }
                    className='text-blue-600 hover:underline flex items-center gap-1'
                  >
                    <Pencil size={14} /> {t("admin_products.edit")}
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className='text-red-600 hover:underline flex items-center gap-1'
                  >
                    <Trash2 size={14} /> {t("admin_products.delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className='flex justify-between mt-4 text-sm'>
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className='px-3 py-1 border rounded disabled:opacity-50'
        >
          {t("admin_products.prev")}
        </button>
        <span>
          {t("admin_products.page")} {currentPage} {t("admin_products.of")}{" "}
          {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className='px-3 py-1 border rounded disabled:opacity-50'
        >
          {t("admin_products.next")}
        </button>
      </div>
    </div>
  );
}
