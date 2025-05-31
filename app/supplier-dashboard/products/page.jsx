"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { db } from "@/firebase/config";
import { useSelector } from "react-redux";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "en";

  const {
    user: currentUser,
    loading: authLoading,
    allUsers = {}, // 🚨 ensure default
  } = useSelector((state) => state.auth);

  const role = currentUser?.role;
  const [products, setProducts] = useState([]);
  const [selectedTab, setSelectedTab] = useState("All");
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    if (authLoading || role !== "supplier") return;
    (async () => {
      const supplierId = currentUser.uid;
      const q = query(
        collection(db, "products"),
        where("supplierId", "==", supplierId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(list);
      setCategories([
        "All",
        ...new Set(list.map((p) => p.category || t("products.uncategorized"))),
      ]);
    })();
  }, [authLoading, currentUser, role, t]);

  const handleDelete = async (id) => {
    if (!confirm(t("products.confirmDelete"))) return;
    await deleteDoc(doc(db, "products", id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const filtered =
    selectedTab === "All"
      ? products
      : products.filter((p) => p.category === selectedTab);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (authLoading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader2 className='animate-spin h-6 w-6' />
      </div>
    );
  }
  if (role !== "supplier") {
    return <p className='p-6'>{t("products.notAuthorized")}</p>;
  }

  return (
    <div className='p-4'>
      {/* Header */}
      <div className='mb-4'>
        <h2 className='text-2xl font-bold text-green-700'>
          {t("products.title")}
        </h2>
        <p className='text-sm text-muted-foreground'>
          {t("products.subtitle")}
        </p>
      </div>

      {/* Category Tabs */}
      <div className='flex gap-2 mb-4 overflow-x-auto'>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedTab === cat ? "default" : "outline"}
            onClick={() => {
              setSelectedTab(cat);
              setCurrentPage(1);
            }}
            className='shrink-0'
          >
            {cat}
            <Badge className='ml-2 bg-muted text-foreground'>
              {cat === "All"
                ? products.length
                : products.filter((p) => p.category === cat).length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Filters & Search */}
      <div className='flex flex-wrap items-center gap-2 mb-4'>
        <Select onValueChange={(v) => console.log(v)}>
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder={t("products.sortBy")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='location'>{t("products.location")}</SelectItem>
            <SelectItem value='price'>{t("products.price")}</SelectItem>
            <SelectItem value='quantity'>{t("products.quantity")}</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder={t("products.searchPlaceholder")}
          className='max-w-sm'
        />
        <Button variant='secondary'>{t("products.filter")}</Button>
        <Button>{t("products.search")}</Button>
      </div>

      {/* Actions */}
      <div className='flex justify-between mb-2 flex-wrap gap-2'>
        <Button variant='outline'>{t("products.export")}</Button>
        <div className='flex gap-2 flex-wrap'>
          <Button variant='outline'>{t("products.options")}</Button>
          <Button
            onClick={() => router.push(`/supplier-dashboard/add-products`)}
          >
            <Plus className='w-4 h-4 mr-2' />
            {t("products.addNew")}
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>{t("products.image")}</TableHead>
              <TableHead>{t("products.name")}</TableHead>
              <TableHead>{t("products.supplierName")}</TableHead>
              <TableHead>{t("products.location")}</TableHead>
              <TableHead>{t("products.pricing")}</TableHead>
              <TableHead>{t("products.size")}</TableHead>
              <TableHead>{t("products.color")}</TableHead>
              <TableHead>{t("products.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((p) => {
              const liveProfile = allUsers?.[p.supplierId];
              const supplierName = liveProfile
                ? liveProfile.displayName
                : p.supplierName || t("products.na");

              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <input type='checkbox' />
                  </TableCell>
                  <TableCell>
                    <img
                      src={p.mainImageUrl || "https://via.placeholder.com/50"}
                      alt=''
                      className='w-10 h-10 rounded'
                    />
                  </TableCell>
                  <TableCell className='text-sm'>
                    {typeof p.productName === "object"
                      ? p.productName[lang] || p.productName.en
                      : p.productName}
                  </TableCell>
                  <TableCell className='text-sm'>{supplierName}</TableCell>
                  <TableCell className='text-sm'>
                    {p.mainLocation || t("products.na")}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {p.priceRanges?.length ? (
                      <ul className='list-disc pl-4'>
                        {p.priceRanges.map((r, i) => (
                          <li key={i}>
                            {t("products.min")}: {r.minQty}, {t("products.max")}
                            : {r.maxQty}, {t("products.price")}: SAR {r.price}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      t("products.na")
                    )}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {p.sizes?.length ? (
                      <ul className='list-disc pl-4'>
                        {p.sizes.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    ) : (
                      t("products.na")
                    )}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {p.colors?.length ? (
                      <ul className='list-disc pl-4'>
                        {p.colors.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    ) : (
                      t("products.na")
                    )}
                  </TableCell>
                  <TableCell className='flex gap-2'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() =>
                        router.push(
                          `/supplier-dashboard/products/${p.id}/edit-products`
                        )
                      }
                    >
                      <Pencil className='w-4 h-4 text-blue-600' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className='w-4 h-4 text-red-600' />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className='flex justify-between items-center mt-4 flex-wrap gap-2'>
        <Button
          variant='outline'
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          {t("products.previous")}
        </Button>
        <span className='text-sm text-muted-foreground'>
          {t("products.page")} {currentPage} {t("products.of")} {totalPages}
        </span>
        <Button
          variant='outline'
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          {t("products.next")}
        </Button>
      </div>
    </div>
  );
}
