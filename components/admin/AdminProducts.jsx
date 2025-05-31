"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { Download, Plus, Search, X } from "lucide-react";

export default function AdminProducts() {
  const router = useRouter();
  const { hasRole, role, loading } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("manual");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchProducts = async () => {
    const snapshot = await getDocs(collection(db, "products"));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setProducts(data);
  };

  useEffect(() => {
    if (!loading && hasRole("admin")) fetchProducts();
  }, [loading, hasRole]);

  const handleDelete = async (id) => {
    if (confirm("Are you sure?")) {
      await deleteDoc(doc(db, "products", id));
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted.");
    }
  };

  const handleExport = () => {
    if (products.length === 0) return toast.error("Nothing to export");
    const data = products.map((p) => ({
      ID: p.id,
      Name:
        typeof p.productName === "object" ? p.productName.en : p.productName,
      Supplier: p.supplierName,
      Location: p.mainLocation,
      Price: p.price,
      Quantity: p.quantity,
      Category: p.category,
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Products");
    XLSX.writeFile(wb, "products.xlsx");
    toast.success("Exported successfully");
  };

  const filtered = products.filter((p) => {
    const keyword = search.toLowerCase();
    return (
      p.productName?.en?.toLowerCase().includes(keyword) ||
      p.supplierName?.toLowerCase().includes(keyword) ||
      p.sku?.toLowerCase().includes(keyword)
    );
  });

  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!loading && role !== "admin")
    return <div className='p-6'>Not authorized</div>;

  return (
    <div className='p-6 space-y-6'>
      <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
        <div>
          <h2 className='text-2xl font-bold text-[#2c6449]'>Products</h2>
          <p className='text-sm text-muted-foreground'>Manage all products</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={handleExport} className='gap-2'>
            <Download className='w-4 h-4' /> Export
          </Button>
          <Button
            onClick={() => router.push("/admin/products/add")}
            className='bg-[#2c6449] hover:bg-[#24523b] text-white gap-2'
          >
            <Plus className='w-4 h-4' /> Add Product
          </Button>
        </div>
      </div>

      <div className='flex flex-col md:flex-row items-center gap-4'>
        <Input
          placeholder='Search by name, supplier, or SKU'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='w-full md:w-64'
        />
      </div>

      <div className='border rounded-lg overflow-x-auto'>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Price Ranges</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((p, i) => (
              <TableRow key={p.id}>
                <TableCell>
                  {(currentPage - 1) * itemsPerPage + i + 1}
                </TableCell>
                <TableCell>
                  {typeof p.productName === "object"
                    ? p.productName.en
                    : p.productName}
                </TableCell>
                <TableCell>{p.supplierName}</TableCell>
                <TableCell>{p.mainLocation}</TableCell>
                <TableCell>
                  {p.priceRanges?.map((r, idx) => (
                    <div key={idx}>
                      {r.minQty} - {r.maxQty} @ {r.price} SAR
                    </div>
                  ))}
                </TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        router.push(`/admin/products/edit/${p.id}`)
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => handleDelete(p.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className='flex justify-between items-center text-sm'>
        <Button
          variant='outline'
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        >
          Previous
        </Button>
        <span>
          Page {currentPage} of {Math.ceil(filtered.length / itemsPerPage)}
        </span>
        <Button
          variant='outline'
          disabled={currentPage === Math.ceil(filtered.length / itemsPerPage)}
          onClick={() =>
            setCurrentPage((p) =>
              Math.min(p + 1, Math.ceil(filtered.length / itemsPerPage))
            )
          }
        >
          Next
        </Button>
      </div>
    </div>
  );
}
