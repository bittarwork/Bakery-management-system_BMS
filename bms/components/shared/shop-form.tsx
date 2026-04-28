"use client";

// Reusable shop create/edit form with Google Maps location picker
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react";

type ShopType = "RETAIL" | "WHOLESALE" | "CAFE" | "RESTAURANT" | "OTHER";

interface ShopFormProps {
  initialData?: {
    id?: string;
    name: string;
    phone: string;
    email?: string;
    shopType: ShopType;
    address: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    isActive?: boolean;
  };
  mode: "create" | "edit";
}

const SHOP_TYPE_LABELS: Record<ShopType, string> = {
  RETAIL: "تجزئة",
  WHOLESALE: "جملة",
  CAFE: "مقهى",
  RESTAURANT: "مطعم",
  OTHER: "أخرى",
};

export function ShopForm({ initialData, mode }: ShopFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    phone: initialData?.phone ?? "",
    email: initialData?.email ?? "",
    shopType: initialData?.shopType ?? "RETAIL",
    address: initialData?.address ?? "",
    city: initialData?.city ?? "",
    latitude: initialData?.latitude ?? null as number | null,
    longitude: initialData?.longitude ?? null as number | null,
    isActive: initialData?.isActive ?? true,
  });

  // Google Maps state
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const initMap = useCallback(() => {
    if (!mapRef.current || !(window as Window & { google?: typeof google }).google) return;

    const defaultCenter = { lat: form.latitude ?? 50.8503, lng: form.longitude ?? 4.3517 };

    const map = new google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
    });

    const marker = new google.maps.Marker({
      map,
      position: form.latitude ? defaultCenter : undefined,
      draggable: true,
      title: "موقع المحل",
    });

    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (pos) {
        setForm((p) => ({ ...p, latitude: pos.lat(), longitude: pos.lng() }));
      }
    });

    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        marker.setPosition(e.latLng);
        setForm((p) => ({
          ...p,
          latitude: e.latLng!.lat(),
          longitude: e.latLng!.lng(),
        }));
      }
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
    setMapLoaded(true);
  }, []);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    if ((window as Window & { google?: typeof google }).google) {
      initMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);
  }, [initMap]);

  function update(field: string, value: string | number | boolean | null) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const url = mode === "create" ? "/api/shops" : `/api/shops/${initialData?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "حدث خطأ");
        return;
      }

      toast.success(mode === "create" ? "تم إضافة المحل بنجاح" : "تم تحديث المحل");
      router.push("/shops");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">اسم المحل *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
            placeholder="مخبز الأمل"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shopType">نوع المحل *</Label>
          <Select value={form.shopType} onValueChange={(v) => update("shopType", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SHOP_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">رقم الهاتف *</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            required
            dir="ltr"
            placeholder="+32 2 123 4567"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            dir="ltr"
            placeholder="shop@example.com"
          />
        </div>
      </div>

      {/* City field — required for route grouping */}
      <div className="space-y-2">
        <Label htmlFor="city">المدينة / المنطقة *</Label>
        <Input
          id="city"
          value={form.city}
          onChange={(e) => update("city", e.target.value)}
          required
          placeholder="Dendermonde / Sint-Niklaas / Merksem..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">العنوان الكامل *</Label>
        <Textarea
          id="address"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          required
          placeholder="Rue de la Loi 12, 1000 Bruxelles"
          rows={2}
        />
      </div>

      {/* Google Maps location picker */}
      <div className="space-y-2">
        <Label>الموقع على الخريطة</Label>
        {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center text-muted-foreground">
              <MapPin className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm">أضف مفتاح Google Maps API لتفعيل اختيار الموقع</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <div
              ref={mapRef}
              className="w-full h-64 rounded-lg border border-border overflow-hidden"
            />
            {form.latitude && form.longitude && (
              <p className="text-xs text-muted-foreground" dir="ltr">
                {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
              </p>
            )}
          </div>
        )}
      </div>

      {mode === "edit" && (
        <div className="flex items-center gap-3">
          <input
            id="isActive"
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => update("isActive", e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="isActive">المحل نشط</Label>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
          {mode === "create" ? "إضافة المحل" : "حفظ التعديلات"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}
