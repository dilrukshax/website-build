"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api-client";

interface StoreProfile {
  niche: string | null;
  storeCurrency: string;
  legalBusinessName: string | null;
  businessAddress: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  supportWhatsapp: string | null;
  shippingPolicy: string | null;
  returnsPolicy: string | null;
  refundPolicy: string | null;
  privacyPolicy: string | null;
  termsPolicy: string | null;
  shippingLeadDays: number | null;
  defaultFxRate: number | null;
  orderNumberPrefix: string | null;
}

interface PricingRule {
  marginType: "percent" | "fixed";
  marginValue: number;
  roundingMode: "none" | "end_99" | "nearest_int";
  minMargin: number | null;
  fxRate: number | null;
}

const TEXT_FIELDS: Array<[keyof StoreProfile, string, boolean]> = [
  ["niche", "Store niche", false],
  ["storeCurrency", "Store currency (3-letter)", false],
  ["legalBusinessName", "Legal business name", false],
  ["businessAddress", "Business address", true],
  ["supportEmail", "Support email", false],
  ["supportPhone", "Support phone", false],
  ["supportWhatsapp", "Support WhatsApp", false],
  ["orderNumberPrefix", "Order number prefix", false],
  ["shippingPolicy", "Shipping policy", true],
  ["returnsPolicy", "Returns policy", true],
  ["refundPolicy", "Refund policy", true],
  ["privacyPolicy", "Privacy policy", true],
  ["termsPolicy", "Terms & conditions", true],
];

export default function StoreSettingsPage() {
  const [profile, setProfile] = useState<Partial<StoreProfile>>({});
  const [rule, setRule] = useState<Partial<PricingRule>>({
    marginType: "percent",
    marginValue: 50,
    roundingMode: "end_99",
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingRule, setSavingRule] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, r] = await Promise.all([
          api.get<StoreProfile>("/cms/store/commerce-settings"),
          api.get<PricingRule | null>("/cms/store/pricing-rule"),
        ]);
        if (p.success && p.data) setProfile(p.data);
        if (r.success && r.data) setRule(r.data);
      } catch {
        setError("Failed to load store settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    setError(null);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = { ...profile };
      if (payload.shippingLeadDays === "" || payload.shippingLeadDays == null)
        delete payload.shippingLeadDays;
      if (payload.defaultFxRate === "" || payload.defaultFxRate == null)
        delete payload.defaultFxRate;
      const res = await api.put<StoreProfile>(
        "/cms/store/commerce-settings",
        payload,
      );
      if (res.success) setMessage("Store settings saved");
      else setError(res.error?.message || "Save failed");
    } catch {
      setError("Save failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveRule = async () => {
    setSavingRule(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.put<PricingRule>("/cms/store/pricing-rule", {
        marginType: rule.marginType,
        marginValue: Number(rule.marginValue),
        roundingMode: rule.roundingMode || "end_99",
        minMargin: rule.minMargin != null ? Number(rule.minMargin) : null,
        fxRate: rule.fxRate != null ? Number(rule.fxRate) : null,
      });
      if (res.success) setMessage("Pricing rule saved");
      else setError(res.error?.message || "Save failed");
    } catch {
      setError("Save failed");
    } finally {
      setSavingRule(false);
    }
  };

  if (loading) return <div className="p-6">Loading store settings…</div>;

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Store Settings</h1>
        <p className="text-sm text-gray-500">
          Niche, branding, trust details, policies and pricing for this store.
        </p>
      </div>

      {message && (
        <div className="rounded bg-green-50 text-green-700 px-4 py-2 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded bg-red-50 text-red-700 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Store profile & policies</h2>
        {TEXT_FIELDS.map(([key, label, multiline]) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-sm font-medium">{label}</label>
            {multiline ? (
              <textarea
                className="border rounded px-3 py-2 text-sm min-h-[80px]"
                value={(profile[key] as string) ?? ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, [key]: e.target.value }))
                }
              />
            ) : (
              <input
                className="border rounded px-3 py-2 text-sm"
                value={(profile[key] as string) ?? ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, [key]: e.target.value }))
                }
              />
            )}
          </div>
        ))}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">
            Shipping lead time (days, shown to customers)
          </label>
          <input
            type="number"
            className="border rounded px-3 py-2 text-sm w-40"
            value={profile.shippingLeadDays ?? ""}
            onChange={(e) =>
              setProfile((p) => ({
                ...p,
                shippingLeadDays: e.target.value
                  ? Number(e.target.value)
                  : null,
              }))
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">
            Default FX rate (supplier → store currency)
          </label>
          <input
            type="number"
            step="0.000001"
            className="border rounded px-3 py-2 text-sm w-48"
            value={profile.defaultFxRate ?? ""}
            onChange={(e) =>
              setProfile((p) => ({
                ...p,
                defaultFxRate: e.target.value ? Number(e.target.value) : null,
              }))
            }
          />
        </div>
        <button
          onClick={saveProfile}
          disabled={savingProfile}
          className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          {savingProfile ? "Saving…" : "Save store settings"}
        </button>
      </section>

      <section className="space-y-4 border-t pt-6">
        <h2 className="text-lg font-medium">Pricing & margin rule</h2>
        <p className="text-sm text-gray-500">
          Applied when publishing imported supplier products.
        </p>
        <div className="flex gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Margin type</label>
            <select
              className="border rounded px-3 py-2 text-sm"
              value={rule.marginType}
              onChange={(e) =>
                setRule((r) => ({
                  ...r,
                  marginType: e.target.value as "percent" | "fixed",
                }))
              }
            >
              <option value="percent">Percent</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Margin value</label>
            <input
              type="number"
              className="border rounded px-3 py-2 text-sm w-32"
              value={rule.marginValue ?? ""}
              onChange={(e) =>
                setRule((r) => ({ ...r, marginValue: Number(e.target.value) }))
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Rounding</label>
            <select
              className="border rounded px-3 py-2 text-sm"
              value={rule.roundingMode}
              onChange={(e) =>
                setRule((r) => ({
                  ...r,
                  roundingMode: e.target.value as PricingRule["roundingMode"],
                }))
              }
            >
              <option value="end_99">Charm (.99)</option>
              <option value="nearest_int">Nearest integer</option>
              <option value="none">None</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Min margin</label>
            <input
              type="number"
              className="border rounded px-3 py-2 text-sm w-32"
              value={rule.minMargin ?? ""}
              onChange={(e) =>
                setRule((r) => ({
                  ...r,
                  minMargin: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
          </div>
        </div>
        <button
          onClick={saveRule}
          disabled={savingRule}
          className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          {savingRule ? "Saving…" : "Save pricing rule"}
        </button>
      </section>
    </div>
  );
}
