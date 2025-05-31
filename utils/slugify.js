// utils/slugify.js
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";

export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
};

export const ensureUniqueSlug = async (baseSlug) => {
  let slug = baseSlug;
  let count = 1;

  while (true) {
    const q = query(collection(db, "products"), where("slug", "==", slug));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return slug; // ✅ slug is available
    }

    // ⚠️ otherwise, try slug-1, slug-2, etc.
    slug = `${baseSlug}-${count}`;
    count++;
  }
};
