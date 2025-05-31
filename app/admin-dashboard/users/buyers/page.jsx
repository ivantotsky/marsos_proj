// app/admin-dashboard/users/buyers/page.jsx
"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
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

export default function BuyerUsersPage() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuyer, setSelectedBuyer] = useState(null);

  // 1️⃣ Load all buyers
  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "buyer"));
        const snap = await getDocs(q);

        setBuyers(
          snap.docs.map((d) => {
            const data = d.data();
            const docId = d.id;
            const uid = data.uid || docId; // real Auth UID

            return {
              docId,
              uid,
              companyName: data.companyName ?? "N/A",
              authPersonName: data.authPersonName ?? "N/A",
              email:
                data.companyEmail ??
                data.authPersonEmail ??
                data.email ??
                "N/A",
              phone:
                data.phone ??
                data.companyPhone ??
                data.authPersonMobile ??
                "N/A",
              approved: !!data.approved,
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
        toast.error("Failed to fetch buyers.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2️⃣ Delete buyer entirely via API
  const handleDelete = (uid) => {
    toast.promise(
      (async () => {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/delete-buyer/${uid}`,
          { method: "DELETE" }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Delete failed");
        }
        setBuyers((prev) => prev.filter((b) => b.uid !== uid));
      })(),
      {
        loading: "Deleting buyer…",
        success: "Buyer and all related data deleted.",
        error: (e) => `Delete failed: ${e.message}`,
      }
    );
  };

  // 3️⃣ Approve & authenticate buyer, migrate doc ID if needed
  const handleApprove = (docId) => {
    toast.promise(
      (async () => {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/approve-and-authenticate-buyer/${docId}`,
          { method: "PUT" }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Approve failed");
        }
        const { newUid } = await res.json();

        setBuyers((prev) =>
          prev.map((b) =>
            b.docId === docId
              ? {
                  ...b,
                  approved: true,
                  docId: newUid,
                  uid: newUid,
                }
              : b
          )
        );
      })(),
      {
        loading: "Approving…",
        success: "Buyer approved & authenticated.",
        error: (e) => `Approve failed: ${e.message}`,
      }
    );
  };

  return (
    <div className='px-6 py-8 max-w-6xl mx-auto'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold'>Buyer Users</h1>
        <Link href='/admin-dashboard/users/buyers/add'>
          <button className='bg-green-700 text-white px-4 py-2 rounded'>
            + Add Buyer
          </button>
        </Link>
      </div>

      {loading ? (
        <p className='text-gray-500'>Loading…</p>
      ) : buyers.length === 0 ? (
        <p className='text-gray-500'>No buyer users found.</p>
      ) : (
        <table className='w-full border text-sm'>
          <thead className='bg-gray-100 text-left'>
            <tr>
              <th className='p-3 border-b'>Company</th>
              <th className='p-3 border-b'>Authorized Person</th>
              <th className='p-3 border-b'>Email</th>
              <th className='p-3 border-b'>Phone</th>
              <th className='p-3 border-b'>Approval</th>
              <th className='p-3 border-b'>Created At</th>
              <th className='p-3 border-b'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {buyers.map((b) => (
              <tr key={b.uid} className='hover:bg-gray-50'>
                <td className='p-3 border-b'>{b.companyName}</td>
                <td className='p-3 border-b'>{b.authPersonName}</td>
                <td className='p-3 border-b'>{b.email}</td>
                <td className='p-3 border-b'>{b.phone}</td>
                <td className='p-3 border-b'>
                  {b.approved ? (
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
                  {b.createdAt ? b.createdAt.toLocaleDateString() : "N/A"}
                </td>
                <td className='p-3 border-b space-x-2'>
                  <Link
                    href={`/admin-dashboard/users/buyers/view-details/${b.docId}`}
                    className='text-blue-600 hover:underline text-sm'
                  >
                    View
                  </Link>

                  {!b.approved && (
                    <button
                      onClick={() => handleApprove(b.docId)}
                      className='text-green-600 hover:underline text-sm'
                    >
                      Approve
                    </button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        onClick={() => setSelectedBuyer(b)}
                        className='text-red-600 hover:underline text-sm'
                      >
                        Delete
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Deleting this buyer cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(b.uid)}>
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
