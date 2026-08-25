import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Receipt, Plus, X } from "lucide-react";
import { propertiesApi, utilityBillsApi, chargesApi } from "../api/endpoints";
import Banner from "../components/Banner";
import Drawer from "../components/Drawer";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import Money from "../components/Money";
import { SkeletonTable } from "../components/Skeleton";
import { formatDate } from "../utils/format";
import { useToast } from "../context/ToastContext";
import { usePageMeta } from "../context/PageMetaContext";
import { ApiError } from "../api/client";

const EMPTY_FORM = {
  property_id: "",
  type: "ELECTRICITY",
  period: "",
  consumption: "",
  total_amount: "",
  due_date: "",
  previous_reading: "",
  current_reading: "",
  meter_code: "",
  supply_number: "",
  provider: "",
  consumption_amount: "",
  fixed_charge: "",
  additional_charges: "",
  tax_amount: "",
  late_fee: ""
};

export default function UtilityBills() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  usePageMeta({ title: t("utilityBills.title") }, [t]);

  const [bills, setBills] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);
  const [detailBill, setDetailBill] = useState(null);

  const [filterService, setFilterService] = useState("ALL");
  const [filterProperty, setFilterProperty] = useState("ALL");
  const [filterPeriod, setFilterPeriod] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [billsRes, propertiesRes] = await Promise.all([utilityBillsApi.list(), propertiesApi.list()]);
      setBills(billsRes.utility_bills || []);
      setProperties(propertiesRes.properties || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      if (filterService !== "ALL" && bill.type !== filterService) return false;
      if (filterProperty !== "ALL" && String(bill.property_id) !== filterProperty) return false;
      if (filterPeriod && bill.period !== filterPeriod) return false;
      return true;
    });
  }, [bills, filterService, filterProperty, filterPeriod]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        property_id: Number(form.property_id),
        consumption: Number(form.consumption),
        total_amount: Number(form.total_amount),
        previous_reading: form.previous_reading === "" ? undefined : Number(form.previous_reading),
        current_reading: form.current_reading === "" ? undefined : Number(form.current_reading),
        consumption_amount: form.consumption_amount === "" ? undefined : Number(form.consumption_amount),
        fixed_charge: form.fixed_charge === "" ? undefined : Number(form.fixed_charge),
        additional_charges: form.additional_charges === "" ? undefined : Number(form.additional_charges),
        tax_amount: form.tax_amount === "" ? undefined : Number(form.tax_amount),
        late_fee: form.late_fee === "" ? undefined : Number(form.late_fee)
      };
      await utilityBillsApi.create(payload);
      toast.success(t("utilityBills.createdSuccess"));
      setDrawerOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate(billId) {
    setGeneratingId(billId);
    try {
      const result = await chargesApi.generate(billId);
      toast.success(
        t("utilityBills.generatedSuccess", {
          count: result.charges.length,
          amount: `S/ ${Number(result.utility_bill.total_amount).toFixed(2)}`
        })
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error(t("utilityBills.alreadyGenerated"));
      } else {
        toast.error(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
      }
    } finally {
      setGeneratingId(null);
    }
  }

  const periods = useMemo(() => [...new Set(bills.map((b) => b.period))].sort().reverse(), [bills]);

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1>{t("utilityBills.title")}</h1>
          <p className="page__subtitle">{t("utilityBills.subtitle")}</p>
        </div>
        <div className="page__header-actions">
          <button className="btn btn--primary" onClick={openCreate}>
            <Plus size={15} /> {t("utilityBills.new")}
          </button>
        </div>
      </header>

      <Banner kind="error">{error}</Banner>

      <div className="filter-bar">
        <select value={filterService} onChange={(e) => setFilterService(e.target.value)}>
          <option value="ALL">{t("utilityBills.filters.allServices")}</option>
          <option value="ELECTRICITY">{t("common.serviceType.ELECTRICITY")}</option>
          <option value="WATER">{t("common.serviceType.WATER")}</option>
        </select>
        <select value={filterProperty} onChange={(e) => setFilterProperty(e.target.value)}>
          <option value="ALL">{t("utilityBills.filters.allProperties")}</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
          <option value="">{t("utilityBills.filters.all")}</option>
          {periods.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <section className="panel">
        {loading ? (
          <SkeletonTable rows={4} columns={6} />
        ) : filteredBills.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={t("utilityBills.empty.title")}
            body={t("utilityBills.empty.body")}
            actionLabel={t("utilityBills.empty.cta")}
            onAction={openCreate}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("utilityBills.columns.period")}</th>
                  <th>{t("utilityBills.columns.service")}</th>
                  <th>{t("utilityBills.columns.provider")}</th>
                  <th>{t("utilityBills.columns.consumption")}</th>
                  <th>{t("utilityBills.columns.amount")}</th>
                  <th>{t("utilityBills.columns.dueDate")}</th>
                  <th aria-label="acciones"></th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => (
                  <tr key={bill.id}>
                    <td data-label={t("utilityBills.columns.period")}>
                      <button className="link-button" style={{ margin: 0 }} onClick={() => setDetailBill(bill)}>
                        {bill.period}
                      </button>
                    </td>
                    <td data-label={t("utilityBills.columns.service")}>
                      {t(`common.serviceType.${bill.type}`, { defaultValue: bill.type })}
                    </td>
                    <td data-label={t("utilityBills.columns.provider")}>{bill.provider || "—"}</td>
                    <td data-label={t("utilityBills.columns.consumption")}>{bill.consumption}</td>
                    <td data-label={t("utilityBills.columns.amount")}>
                      <Money value={bill.total_amount} />
                    </td>
                    <td data-label={t("utilityBills.columns.dueDate")}>
                      {bill.due_date ? formatDate(bill.due_date, i18n.language) : "—"}
                    </td>
                    <td className="table__actions">
                      <button
                        className="btn btn--small"
                        disabled={generatingId === bill.id}
                        onClick={() => handleGenerate(bill.id)}
                      >
                        {generatingId === bill.id ? t("utilityBills.generating") : t("utilityBills.generateCharges")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={t("utilityBills.new")}>
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>{t("utilityBills.form.property")}</span>
            <select
              value={form.property_id}
              onChange={(e) => setForm({ ...form, property_id: e.target.value })}
              required
            >
              <option value="" disabled>
                —
              </option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>{t("utilityBills.form.type")}</span>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="ELECTRICITY">{t("common.serviceType.ELECTRICITY")}</option>
              <option value="WATER">{t("common.serviceType.WATER")}</option>
            </select>
          </label>

          <label className="field">
            <span>{t("utilityBills.form.period")}</span>
            <input
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
              placeholder="2026-08"
              required
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>{t("utilityBills.form.consumption")}</span>
              <input
                type="number"
                step="0.001"
                value={form.consumption}
                onChange={(e) => setForm({ ...form, consumption: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>{t("utilityBills.form.totalAmount")}</span>
              <input
                type="number"
                step="0.01"
                value={form.total_amount}
                onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
                required
              />
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>{t("utilityBills.form.previousReading")}</span>
              <input
                type="number"
                step="0.001"
                value={form.previous_reading}
                onChange={(e) => setForm({ ...form, previous_reading: e.target.value })}
              />
            </label>
            <label className="field">
              <span>{t("utilityBills.form.currentReading")}</span>
              <input
                type="number"
                step="0.001"
                value={form.current_reading}
                onChange={(e) => setForm({ ...form, current_reading: e.target.value })}
              />
            </label>
          </div>

          <label className="field">
            <span>{t("utilityBills.form.dueDate")}</span>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </label>

          <label className="field">
            <span>{t("utilityBills.form.meterCode")}</span>
            <input value={form.meter_code} onChange={(e) => setForm({ ...form, meter_code: e.target.value })} />
          </label>

          <label className="field">
            <span>{t("utilityBills.form.supplyNumber")}</span>
            <input
              value={form.supply_number}
              onChange={(e) => setForm({ ...form, supply_number: e.target.value })}
            />
          </label>

          <label className="field">
            <span>{t("utilityBills.form.provider")}</span>
            <input
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
              placeholder="LUZ_DEL_SUR / SEDAPAL"
            />
          </label>

          <div className="form__actions">
            <button className="btn btn--primary" type="submit" disabled={saving}>
              {saving ? t("common.feedback.saving") : t("utilityBills.form.submit")}
            </button>
          </div>
        </form>
      </Drawer>

      {detailBill && (
        <div className="modal-overlay" onMouseDown={() => setDetailBill(null)}>
          <div className="confirm-dialog" style={{ maxWidth: 420, textAlign: "left" }} onMouseDown={(e) => e.stopPropagation()}>
            <div className="panel__header">
              <h2>{t("utilityBills.detail.title")}</h2>
              <button className="icon-btn" onClick={() => setDetailBill(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="form" style={{ gap: 8, marginBottom: 12 }}>
              <div>
                <StatusBadge status={detailBill.status || "PENDING"} />
              </div>
              <div>{detailBill.period} · {t(`common.serviceType.${detailBill.type}`, { defaultValue: detailBill.type })}</div>
            </div>
            <h3 style={{ marginBottom: 8 }}>{t("utilityBills.detail.breakdown")}</h3>
            <table className="table">
              <tbody>
                <tr>
                  <td>{t("utilityBills.detail.consumptionAmount")}</td>
                  <td className="money" style={{ textAlign: "right" }}>
                    <Money value={detailBill.consumption_amount} />
                  </td>
                </tr>
                <tr>
                  <td>{t("utilityBills.detail.fixedCharge")}</td>
                  <td className="money" style={{ textAlign: "right" }}>
                    <Money value={detailBill.fixed_charge} />
                  </td>
                </tr>
                <tr>
                  <td>{t("utilityBills.detail.additionalCharges")}</td>
                  <td className="money" style={{ textAlign: "right" }}>
                    <Money value={detailBill.additional_charges} />
                  </td>
                </tr>
                <tr>
                  <td>{t("utilityBills.detail.taxAmount")}</td>
                  <td className="money" style={{ textAlign: "right" }}>
                    <Money value={detailBill.tax_amount} />
                  </td>
                </tr>
                <tr>
                  <td>{t("utilityBills.detail.lateFee")}</td>
                  <td className="money" style={{ textAlign: "right" }}>
                    <Money value={detailBill.late_fee} />
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>{t("utilityBills.detail.total")}</strong>
                  </td>
                  <td className="money" style={{ textAlign: "right" }}>
                    <strong>
                      <Money value={detailBill.total_amount} />
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
