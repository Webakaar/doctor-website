"use client";

import { useState } from "react";
import { Edit3, Plus, Tag, Trash2, X } from "lucide-react";
import type { Coupon, CouponDiscountType } from "@/types/hospital";

interface CouponFormState {
  id?: string;
  code: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: string;
  maxDiscountAmount: string;
  minFeeAmount: string;
  usageLimit: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

function toLocalDateInput(iso?: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function AdminCouponsClient({
  initialCoupons
}: {
  initialCoupons: Coupon[];
}) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [editing, setEditing] = useState<CouponFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function openNew() {
    setFormError("");
    setEditing({
      code: "",
      description: "",
      discountType: "percent",
      discountValue: "10",
      maxDiscountAmount: "",
      minFeeAmount: "0",
      usageLimit: "",
      validFrom: "",
      validUntil: "",
      isActive: true
    });
  }

  function openEdit(coupon: Coupon) {
    setFormError("");
    setEditing({
      id: coupon.id,
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      maxDiscountAmount:
        coupon.maxDiscountAmount !== undefined
          ? String(coupon.maxDiscountAmount)
          : "",
      minFeeAmount: String(coupon.minFeeAmount ?? 0),
      usageLimit:
        coupon.usageLimit !== undefined ? String(coupon.usageLimit) : "",
      validFrom: toLocalDateInput(coupon.validFrom),
      validUntil: toLocalDateInput(coupon.validUntil),
      isActive: coupon.isActive
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setFormError("");
    setSaving(true);
    try {
      const isEdit = Boolean(editing.id);
      const payload = {
        id: editing.id,
        code: editing.code.trim().toUpperCase(),
        description: editing.description.trim(),
        discountType: editing.discountType,
        discountValue: Number(editing.discountValue || 0),
        maxDiscountAmount: editing.maxDiscountAmount.trim()
          ? Number(editing.maxDiscountAmount)
          : null,
        minFeeAmount: Number(editing.minFeeAmount || 0),
        usageLimit: editing.usageLimit.trim()
          ? Number(editing.usageLimit)
          : null,
        validFrom: editing.validFrom
          ? new Date(`${editing.validFrom}T00:00:00.000Z`).toISOString()
          : null,
        validUntil: editing.validUntil
          ? new Date(`${editing.validUntil}T23:59:59.999Z`).toISOString()
          : null,
        isActive: editing.isActive
      };

      const res = await fetch("/api/admin/coupons", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Unable to save coupon.");
        return;
      }

      if (isEdit) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === data.coupon.id ? data.coupon : c))
        );
      } else {
        setCoupons((prev) => [data.coupon, ...prev]);
      }
      setEditing(null);
    } catch {
      setFormError("Network error while saving coupon.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(coupon: Coupon) {
    const res = await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: coupon.id,
        code: coupon.code,
        description: coupon.description || "",
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount ?? null,
        minFeeAmount: coupon.minFeeAmount ?? 0,
        usageLimit: coupon.usageLimit ?? null,
        validFrom: coupon.validFrom ?? null,
        validUntil: coupon.validUntil ?? null,
        isActive: !coupon.isActive
      })
    });
    const data = await res.json();
    if (res.ok && data.coupon) {
      setCoupons((prev) =>
        prev.map((c) => (c.id === data.coupon.id ? data.coupon : c))
      );
    }
  }

  async function handleDelete(coupon: Coupon) {
    if (!confirm(`Delete coupon ${coupon.code}?`)) return;
    const res = await fetch(`/api/admin/coupons?id=${coupon.id}`, {
      method: "DELETE"
    });
    if (res.ok) {
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Promo Coupons &amp; Discounts
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Create percentage or flat discount codes that patients can apply during appointment checkout.
          </p>
        </div>

        <button type="button" onClick={openNew} className="btn-primary">
          <Plus className="h-4 w-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="card-clinical p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Tag className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            No promo coupons yet
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Create your first coupon code (for example, WELCOME20 or FLAT200) to offer discounts on consultations.
          </p>
          <button
            type="button"
            onClick={openNew}
            className="btn-primary mt-5"
          >
            <Plus className="h-4 w-4" />
            <span>Add First Coupon</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="card-clinical p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 font-mono text-sm font-extrabold text-brand-700">
                    <Tag className="h-3.5 w-3.5" />
                    <span>{coupon.code}</span>
                  </span>
                  <p className="mt-2 text-lg font-extrabold text-slate-900">
                    {coupon.discountType === "percent"
                      ? `${coupon.discountValue}% OFF`
                      : `₹${coupon.discountValue} OFF`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleActive(coupon)}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    coupon.isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {coupon.isActive ? "Active" : "Inactive"}
                </button>
              </div>

              {coupon.description && (
                <p className="mt-2 text-xs text-slate-600">
                  {coupon.description}
                </p>
              )}

              <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <p>
                  Used:{" "}
                  <strong className="text-slate-800">
                    {coupon.usedCount}
                    {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " / ∞"}
                  </strong>
                </p>
                <p>
                  Min Fee:{" "}
                  <strong className="text-slate-800">
                    ₹{coupon.minFeeAmount}
                  </strong>
                  {coupon.maxDiscountAmount
                    ? ` · Max Discount: ₹${coupon.maxDiscountAmount}`
                    : ""}
                </p>
                {(coupon.validFrom || coupon.validUntil) && (
                  <p>
                    Validity: {toLocalDateInput(coupon.validFrom) || "Any"} to{" "}
                    {toLocalDateInput(coupon.validUntil) || "No expiry"}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => openEdit(coupon)}
                  className="btn-secondary flex-1 py-1.5 text-xs"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(coupon)}
                  className="btn-secondary border-rose-200 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                  aria-label={`Delete ${coupon.code}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900">
                {editing.id ? `Edit Coupon (${editing.code})` : "Create New Coupon"}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={editing.code}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      code: e.target.value.toUpperCase()
                    })
                  }
                  placeholder="HEALTH20"
                  className="input-clinical font-mono uppercase"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Description
                </label>
                <input
                  type="text"
                  value={editing.description}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                  placeholder="20% off first specialist consultation"
                  className="input-clinical"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Discount Type *
                  </label>
                  <select
                    value={editing.discountType}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        discountType: e.target.value as CouponDiscountType
                      })
                    }
                    className="input-clinical"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={editing.discountType === "percent" ? "100" : undefined}
                    value={editing.discountValue}
                    onChange={(e) =>
                      setEditing({ ...editing, discountValue: e.target.value })
                    }
                    className="input-clinical"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Min Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editing.minFeeAmount}
                    onChange={(e) =>
                      setEditing({ ...editing, minFeeAmount: e.target.value })
                    }
                    className="input-clinical"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Max Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Optional"
                    value={editing.maxDiscountAmount}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        maxDiscountAmount: e.target.value
                      })
                    }
                    className="input-clinical"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={editing.usageLimit}
                    onChange={(e) =>
                      setEditing({ ...editing, usageLimit: e.target.value })
                    }
                    className="input-clinical"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={editing.validFrom}
                    onChange={(e) =>
                      setEditing({ ...editing, validFrom: e.target.value })
                    }
                    className="input-clinical"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={editing.validUntil}
                    onChange={(e) =>
                      setEditing({ ...editing, validUntil: e.target.value })
                    }
                    className="input-clinical"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) =>
                    setEditing({ ...editing, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span>Coupon is active and redeemable at checkout</span>
              </label>

              <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? "Saving..." : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
