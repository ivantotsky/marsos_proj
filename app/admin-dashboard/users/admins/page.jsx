"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/config";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "admin"));
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAdmins(users);
      } catch (error) {
        toast.error("Failed to fetch admins.");
        console.error("Error fetching admins:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  const handleDelete = async (id) => {
    try {
      await toast.promise(deleteDoc(doc(db, "users", id)), {
        loading: "Deleting admin...",
        success: "Admin deleted successfully.",
        error: "Failed to delete admin.",
      });

      setAdmins((prev) => prev.filter((admin) => admin.id !== id));
    } catch (err) {
      console.error("Error deleting admin:", err);
    }
  };

  const handleEdit = (id) => {
    router.push(`/admin-dashboard/users/edit/${id}`);
  };

  return (
    <div className='px-6 py-8 max-w-6xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>Admin Users</h1>

      {loading ? (
        <p className='text-gray-500'>Loading...</p>
      ) : admins.length === 0 ? (
        <p className='text-gray-500'>No admin users found.</p>
      ) : (
        <table className='w-full border text-sm'>
          <thead className='bg-gray-100 text-left'>
            <tr>
              <th className='p-3 border-b'>Name</th>
              <th className='p-3 border-b'>Email</th>
              <th className='p-3 border-b'>Created At</th>
              <th className='p-3 border-b'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className='hover:bg-gray-50'>
                <td className='p-3 border-b'>{admin.name || "N/A"}</td>
                <td className='p-3 border-b'>{admin.email || "N/A"}</td>
                <td className='p-3 border-b'>
                  {admin.createdAt
                    ? new Date(
                        admin.createdAt.seconds * 1000
                      ).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className='p-3 border-b space-x-2'>
                  <button
                    onClick={() => handleEdit(admin.id)}
                    className='text-blue-600 hover:underline text-sm'
                  >
                    Edit
                  </button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        onClick={() => setSelectedAdmin(admin)}
                        className='text-red-600 hover:underline text-sm'
                      >
                        Delete
                      </button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this admin? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className='bg-red-600 hover:bg-red-700'
                          onClick={() => handleDelete(admin.id)}
                        >
                          Yes, Delete
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
