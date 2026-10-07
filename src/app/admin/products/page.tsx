"use client";

import { useState, useEffect } from "react";
import { createServiceClient } from "@/lib/supabase/service";
import { Button } from "@/components/ui/button";
import { toPersianDigits } from "@/lib/numbers";

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    slug: "",
    shortDescription: "",
    salePrice: 0,
    compareAtPrice: 0,
    brand: "",
    category: "",
  });

  const loadProducts = async () => {
    try {
      const supabase = createServiceClient();
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.slug) return;

    try {
      const supabase = createServiceClient();
      const { error } = await supabase.from("products").insert({
        name: newProduct.name,
        slug: newProduct.slug,
        description: newProduct.shortDescription,
        short_description: newProduct.shortDescription,
        sale_price: newProduct.salePrice,
        compare_at_price: newProduct.compareAtPrice,
        status: "published",
        is_active: true,
        specifications: {},
        colors: [],
        sizes: [],
      });

      if (error) throw error;

      alert("محصول با موفقیت اضافه شد!");
      setNewProduct({ name: "", slug: "", shortDescription: "", salePrice: 0, compareAtPrice: 0, brand: "", category: "" });
      setShowAddProduct(false);
      loadProducts();
    } catch (err: any) {
      alert("خطا: " + err.message);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div>
        <h1 className="text-xl font-bold">محصولات</h1>
        <p className="text-muted-foreground text-sm">مدیریت محصولات فروشگاه</p>
      </div>

      <div className="border-border overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="p-3 text-right font-medium">نام محصول</th>
              <th className="p-3 text-right font-medium">قیمت فروش</th>
              <th className="p-3 text-right font-medium">قیمت مقایسه</th>
              <th className="p-3 text-right font-medium">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-border border-t">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{toPersianDigits(p.sale_price.toLocaleString("fa-IR"))}</td>
                <td className="p-3">{toPersianDigits(p.compare_at_price.toLocaleString("fa-IR"))}</td>
                <td className="p-3">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* بخش افزودن محصول جدید */}
      <div className="border-border rounded-xl border p-4">
        <h2 className="mb-3 font-semibold">افزودن محصول جدید</h2>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="نام محصول *"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
          />
          <input
            type="text"
            placeholder="اسلاگ (slug) *"
            value={newProduct.slug}
            onChange={(e) => setNewProduct({ ...newProduct, slug: e.target.value })}
            className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
          />
          <textarea
            placeholder="توضیح کوتاه"
            value={newProduct.shortDescription}
            onChange={(e) => setNewProduct({ ...newProduct, shortDescription: e.target.value })}
            rows={2}
            className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="قیمت فروش (تومان)"
              value={newProduct.salePrice}
              onChange={(e) => setNewProduct({ ...newProduct, salePrice: Number(e.target.value) })}
              className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
            />
            <input
              type="number"
              placeholder="قیمت مقایسه (تومان)"
              value={newProduct.compareAtPrice}
              onChange={(e) => setNewProduct({ ...newProduct, compareAtPrice: Number(e.target.value) })}
              className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddProduct} className="flex-1">
              افزودن محصول
            </Button>
            <Button variant="outline" onClick={() => setShowAddProduct(false)}>
              انصراف
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
