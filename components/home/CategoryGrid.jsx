"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import { db } from "@/firebase/config";

const slugify = (text) =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-ا-ي]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

const CategoryGrid = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const allProducts = snapshot.docs.map((doc) => doc.data());

        const categoryMap = {};

        allProducts.forEach((product) => {
          const category = product.category?.trim() || "Uncategorized";
          const slug = slugify(category);

          if (!categoryMap[slug]) {
            categoryMap[slug] = {
              name: category,
              slug: slug,
              image: product.mainImageUrl || "https://via.placeholder.com/100",
              badge: product.categoryBadge || "",
            };
          }
        });

        setCategories(Object.values(categoryMap));
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchAllCategories();
  }, []);

  if (!categories.length) return null;

  return (
    <section className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>
      <h2 className='text-2xl font-bold text-center mb-10 text-[#2c6449]'>
        Explore Categories
      </h2>

      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-6'>
        {categories.map((cat, index) => (
          <Link
            href={`/category/${cat.slug}`}
            key={index}
            className='relative group flex flex-col items-center p-4 border rounded-xl hover:shadow-md hover:border-[#2c6449] transition duration-300'
          >
            {/* Badge */}
            {cat.badge && (
              <span className='absolute top-2 right-2 bg-red-500 text-white text-[10px] px-2 py-[2px] rounded-full uppercase tracking-wide'>
                {cat.badge}
              </span>
            )}

            {/* Image Circle */}
            <div className='w-20 h-20 rounded-full border-[2.5px] border-[#2c6449] overflow-hidden shadow-sm group-hover:shadow-md transition'>
              <img
                src={cat.image}
                alt={cat.name}
                className='w-full h-full object-cover'
              />
            </div>

            {/* Label */}
            <p className='text-sm font-medium mt-4 text-[#2c2f38] group-hover:text-[#2c6449] text-center max-w-[100px] truncate'>
              {cat.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;
