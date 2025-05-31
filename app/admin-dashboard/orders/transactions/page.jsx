"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import { useSelector } from "react-redux";
import { db } from "@/firebase/config";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import sarSymbol from "@/public/sar_symbol.svg";

const PAGE_SIZE = 10;

export default function AdminTransactions() {
  const router = useRouter();

  // Pull auth state from Redux:
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const role = user?.role;

  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pageData, setPageData] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    paid: 0,
    pending: 0,
    failed: 0,
  });
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchEmail, setSearchEmail] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingData, setLoadingData] = useState(true);

  const prevCount = useRef(0);
  const audioRef = useRef(null);

  // 🚪 Redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || role !== "admin")) {
      router.replace("/admin-login");
    }
  }, [authLoading, user, role, router]);

  // 🔁 Live subscription
  useEffect(() => {
    if (authLoading || !user || role !== "admin") return;

    const unsub = onSnapshot(collection(db, "orders"), (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const at = a.createdAt?.toDate?.().getTime() ?? 0;
          const bt = b.createdAt?.toDate?.().getTime() ?? 0;
          return bt - at;
        });

      // play sound on new order
      if (docs.length > prevCount.current) {
        audioRef.current?.play().catch(() => toast("🔔 New order received!"));
      }
      prevCount.current = docs.length;

      // count statuses
      const counts = { paid: 0, pending: 0, failed: 0 };
      docs.forEach((o) => {
        const s = o.orderStatus?.toLowerCase();
        if (s in counts) counts[s]++;
      });

      setStatusCounts(counts);
      setTransactions(docs);
      setFiltered(docs);
      setLoadingData(false);
    });

    return () => unsub();
  }, [authLoading, user, role]);

  // 🔍 Filter by status/email
  useEffect(() => {
    let out = [...transactions];
    if (filterStatus !== "all") {
      out = out.filter((o) => o.orderStatus?.toLowerCase() === filterStatus);
    }
    if (searchEmail) {
      out = out.filter((o) =>
        o.userEmail?.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }
    setFiltered(out);
    setCurrentPage(1);
  }, [filterStatus, searchEmail, transactions]);

  // 📄 Paginate
  useEffect(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    setPageData(filtered.slice(start, start + PAGE_SIZE));
  }, [filtered, currentPage]);

  // 📥 CSV export
  const exportCSV = () => {
    const header = ["Order ID", "Email", "Amount", "Status", "Date"];
    const rows = filtered.map((o) => [
      o.id,
      o.userEmail || "N/A",
      Number(o.totalAmount || 0).toFixed(2),
      o.orderStatus,
      o.createdAt?.toDate?.().toLocaleString() || "N/A",
    ]);
    const csv =
      "data:text/csv;charset=utf-8," +
      [header, ...rows].map((r) => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "transactions.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalRevenue = filtered.reduce(
    (sum, o) => sum + Number(o.totalAmount || 0),
    0
  );

  if (loadingData) {
    return <p className='text-center mt-10'>Loading…</p>;
  }

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      <audio ref={audioRef} src='/sounds/notification.mp3' preload='auto' />

      <div className='flex flex-wrap gap-3 mb-5'>
        <Input
          placeholder='Search by email'
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className='w-64'
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className='border px-3 py-2 rounded text-sm'
        >
          <option value='all'>All ({transactions.length})</option>
          <option value='paid'>Paid ({statusCounts.paid})</option>
          <option value='pending'>Pending ({statusCounts.pending})</option>
          <option value='failed'>Failed ({statusCounts.failed})</option>
        </select>
        <Button onClick={exportCSV}>Export CSV</Button>
      </div>

      <div className='overflow-auto border rounded-md'>
        <table className='min-w-full text-sm'>
          <thead className='bg-[#2c6449] text-white'>
            <tr>
              <th className='p-2 text-left'>Order ID</th>
              <th className='p-2 text-left'>Email</th>
              <th className='p-2 text-left'>Amount</th>
              <th className='p-2 text-left'>Status</th>
              <th className='p-2 text-left'>Date</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((o) => (
              <tr key={o.id} className='border-b'>
                <td className='p-2'>{o.id}</td>
                <td className='p-2'>{o.userEmail}</td>
                <td className='p-2 flex items-center gap-1'>
                  <img src={sarSymbol.src} alt='SAR' className='w-4 h-4' />
                  {Number(o.totalAmount || 0).toFixed(2)}
                </td>
                <td
                  className={`p-2 ${
                    o.orderStatus === "paid"
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}
                >
                  {o.orderStatus}
                </td>
                <td className='p-2'>
                  {o.createdAt?.toDate?.().toLocaleString() || "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='text-right mt-4'>Total: {totalRevenue.toFixed(2)} SR</div>

      <div className='flex justify-center mt-6 gap-2'>
        {Array.from({ length: Math.ceil(filtered.length / PAGE_SIZE) }).map(
          (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1
                  ? "bg-[#2c6449] text-white"
                  : "border text-[#2c6449]"
              }`}
            >
              {i + 1}
            </button>
          )
        )}
      </div>
    </div>
  );
}
