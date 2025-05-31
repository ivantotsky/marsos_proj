// app/admin-dashboard/users/suppliers/page.jsx
"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/config";
import { collection, getDocs, query, where, or, doc } from "firebase/firestore";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function SupplierUsersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // 1️⃣ Load all suppliers
  useEffect(() => {
    (async () => {
      try {
        const q = query(
          collection(db, "users"),
          or(where("role", "==", "supplier"), where("role", "==", "Supplier"))
        );
        const snap = await getDocs(q);

        setSuppliers(
          snap.docs.map((d) => {
            const data = d.data();
            const docId = d.id;
            const uid = data.uid || docId; // true Auth UID

            return {
              docId,
              uid,
              name:
                data.companyName ??
                data.representativeName ??
                data.authPersonName ??
                data.name ??
                "N/A",
              email:
                data.companyEmail ??
                data.representativeEmail ??
                data.authPersonEmail ??
                data.email ??
                "N/A",
              phone:
                data.phone ??
                data.companyPhone ??
                data.representativePhone ??
                data.authPersonMobile ??
                "N/A",
              approved:
                typeof data.approved === "boolean"
                  ? data.approved
                  : data.isApproved ?? false,
              createdAt: data.createdAt?.seconds
                ? new Date(data.createdAt.seconds * 1000)
                : data.createdAt
                ? new Date(data.createdAt)
                : null,
            };
          })
        );
      } catch (e) {
        console.error(e);
        toast.error("Failed to fetch suppliers.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Delete supplier entirely (via your API)
  const handleDelete = (uid) => {
    toast.promise(
      (async () => {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/delete-supplier/${uid}`,
          { method: "DELETE" }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Delete failed");
        }
        // Only update UI after server has wiped everything
        setSuppliers((prev) => prev.filter((u) => u.uid !== uid));
      })(),
      {
        loading: "Deleting supplier…",
        success: "Supplier and all related data deleted.",
        error: (e) => `Delete failed: ${e.message}`,
      }
    );
  };

  // Combined approve + authenticate in one call
  const handleApprove = (docId) => {
    toast.promise(
      (async () => {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/approve-and-authenticate-supplier/${docId}`,
          { method: "PUT" }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Approve & authenticate failed");
        }

        const { newUid } = await res.json();
        // reflect in UI
        setSuppliers((prev) =>
          prev.map((u) =>
            u.docId === docId
              ? {
                  ...u,
                  approved: true,
                  docId: newUid,
                  uid: newUid,
                }
              : u
          )
        );
      })(),
      {
        loading: "Approving & authenticating…",
        success: "Supplier approved & authenticated.",
        error: (e) => e.message,
      }
    );
  };

  return (
    <div className='px-6 py-8 max-w-6xl mx-auto'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold'>Supplier Users</h1>
        <Link href='/admin-dashboard/users/suppliers/add'>
          <button className='bg-green-700 text-white px-4 py-2 rounded'>
            + Add Supplier
          </button>
        </Link>
      </div>

      {loading ? (
        <p className='text-gray-500'>Loading…</p>
      ) : suppliers.length === 0 ? (
        <p className='text-gray-500'>No supplier users found.</p>
      ) : (
        <table className='w-full border text-sm'>
          <thead className='bg-gray-100 text-left'>
            <tr>
              <th className='p-3 border-b'>Name</th>
              <th className='p-3 border-b'>Email</th>
              <th className='p-3 border-b'>Phone</th>
              <th className='p-3 border-b'>Approval</th>
              <th className='p-3 border-b'>Created At</th>
              <th className='p-3 border-b'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.uid} className='hover:bg-gray-50'>
                <td className='p-3 border-b'>{s.name}</td>
                <td className='p-3 border-b'>{s.email}</td>
                <td className='p-3 border-b'>{s.phone}</td>
                <td className='p-3 border-b'>
                  {s.approved ? (
                    <span className='px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full'>
                      Approved
                    </span>
                  ) : (
                    <span className='px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full'>
                      Pending
                    </span>
                  )}
                </td>
                <td className='p-3 border-b'>
                  {s.createdAt ? s.createdAt.toLocaleDateString() : "N/A"}
                </td>
                <td className='p-3 border-b space-x-2'>
                  <Link
                    href={`/admin-dashboard/users/suppliers/view-details/${s.docId}`}
                    className='text-blue-600 hover:underline text-sm'
                  >
                    View
                  </Link>
                  {!s.approved && (
                    <button
                      onClick={() => handleApprove(s.docId)}
                      className='text-green-600 hover:underline text-sm'
                    >
                      Approve
                    </button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        onClick={() => setSelectedSupplier(s)}
                        className='text-red-600 hover:underline text-sm'
                      >
                        Delete
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(s.uid)}>
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
