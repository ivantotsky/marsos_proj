"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Trash2, Pencil, Plus } from "lucide-react";

const ProductCategoriesPage = () => {
  const { t, i18n } = useTranslation();
  // Read auth state from Redux
  const { user, loading: authLoading } = useSelector((state) => state.auth);

  const [categories, setCategories] = useState([]);
  const [newCategoryEn, setNewCategoryEn] = useState("");
  const [newCategoryAr, setNewCategoryAr] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Fetch all categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "categories"));
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(list);
      } catch (err) {
        toast.error("Failed to fetch categories.");
        console.error(err);
      }
    };

    fetchCategories();
  }, []);

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategoryEn.trim() || !newCategoryAr.trim()) {
      toast.error("Both English and Arabic names are required.");
      return;
    }

    try {
      const newCat = {
        name: {
          en: newCategoryEn.trim(),
          ar: newCategoryAr.trim(),
        },
      };
      await addDoc(collection(db, "categories"), newCat);
      toast.success("Category added!");
      setNewCategoryEn("");
      setNewCategoryAr("");
      window.location.reload(); // Reload to reflect new category
    } catch (err) {
      toast.error("Error adding category.");
      console.error(err);
    }
  };

  // Update category
  const handleUpdate = async (id) => {
    const updatedCat = categories.find((cat) => cat.id === id);
    if (
      !updatedCat ||
      !updatedCat.name.en.trim() ||
      !updatedCat.name.ar.trim()
    ) {
      toast.error("Cannot update with empty values.");
      return;
    }

    try {
      await updateDoc(doc(db, "categories", id), {
        name: {
          en: updatedCat.name.en,
          ar: updatedCat.name.ar,
        },
      });
      toast.success("Category updated.");
      setEditingId(null);
    } catch (err) {
      toast.error("Failed to update.");
      console.error(err);
    }
  };

  // Delete category
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteDoc(doc(db, "categories", id));
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted.");
    } catch (err) {
      toast.error("Failed to delete category.");
      console.error(err);
    }
  };

  // Handle inline editing
  const handleEditChange = (id, lang, value) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === id ? { ...cat, name: { ...cat.name, [lang]: value } } : cat
      )
    );
  };

  // 1) While auth is initializing, show loader
  if (authLoading) {
    return <div>Loading…</div>;
  }

  // 2) Once loaded, block non-admins
  if (user?.role !== "admin") {
    return <div>You are not authorized.</div>;
  }

  return (
    <div className='max-w-3xl mx-auto p-4'>
      <h2 className='text-2xl font-bold text-[#2c6449] mb-4'>
        Product Categories
      </h2>

      {/* Add New Category */}
      <div className='mb-6 space-y-2'>
        <h4 className='font-semibold'>Add New Category</h4>
        <input
          type='text'
          placeholder='Category Name (EN)'
          className='border px-3 py-2 w-full rounded'
          value={newCategoryEn}
          onChange={(e) => setNewCategoryEn(e.target.value)}
        />
        <input
          type='text'
          placeholder='Category Name (AR)'
          className='border px-3 py-2 w-full rounded'
          value={newCategoryAr}
          onChange={(e) => setNewCategoryAr(e.target.value)}
        />
        <button
          onClick={handleAddCategory}
          className='mt-2 bg-[#2c6449] text-white px-4 py-2 rounded flex items-center gap-2'
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Category Table */}
      <table className='w-full border text-sm'>
        <thead className='bg-gray-100 text-left'>
          <tr>
            <th className='p-2'>#</th>
            <th className='p-2'>Name (EN)</th>
            <th className='p-2'>Name (AR)</th>
            <th className='p-2'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat, i) => (
            <tr key={cat.id} className='border-b'>
              <td className='p-2'>{i + 1}</td>
              <td className='p-2'>
                {editingId === cat.id ? (
                  <input
                    className='border px-2 py-1 rounded w-full'
                    value={cat.name.en}
                    onChange={(e) =>
                      handleEditChange(cat.id, "en", e.target.value)
                    }
                  />
                ) : (
                  cat.name.en
                )}
              </td>
              <td className='p-2'>
                {editingId === cat.id ? (
                  <input
                    className='border px-2 py-1 rounded w-full'
                    value={cat.name.ar}
                    onChange={(e) =>
                      handleEditChange(cat.id, "ar", e.target.value)
                    }
                  />
                ) : (
                  cat.name.ar
                )}
              </td>
              <td className='p-2 flex gap-2'>
                {editingId === cat.id ? (
                  <button
                    className='text-green-600 underline'
                    onClick={() => handleUpdate(cat.id)}
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => setEditingId(cat.id)}
                    className='text-blue-600 flex items-center gap-1'
                  >
                    <Pencil size={14} /> Edit
                  </button>
                )}
                <button
                  onClick={() => handleDelete(cat.id)}
                  className='text-red-600 flex items-center gap-1'
                >
                  <Trash2 size={14} /> Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductCategoriesPage;
