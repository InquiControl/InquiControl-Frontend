import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Wallet, Plus, Lock } from "lucide-react";
import { chargesApi, paymentsApi } from "../api/endpoints";
import Banner from "../components/Banner";
import Drawer from "../components/Drawer";
import EmptyState from "../components/EmptyState";
import Money, { formatMoney } from "../components/Money";
import { SkeletonTable } from "../components/Skeleton";
import { formatDate } from "../utils/format";
import { useToast } from "../context/ToastContext";
import { usePageMeta } from "../context/PageMetaContext";
import { ApiError } from "../api/client";

const today = () => new Date().toISOString().substring(0, 10);

export default function Payments() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const toast = useToast();
  usePageMeta({ title: t("payments.title") }, [t]);

  const [payments, setPayments] = useState([]);
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chargeId, setChargeId] = useState("");
  const [paymentDate, setPaymentDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const pendingCharges = charges.filter((c) => c.status === "PENDING");
  const selectedCharge = pendingCharges.find((c) => String(c.id) === String(chargeId));

  async function load() {
    setLoading(true);
    try {
      const [paymentsRes, chargesRes] = await Promise.all([paymentsApi.list(), chargesApi.list()]);
      setPayments(paymentsRes.payments || []);
      setCharges(chargesRes.charges || []);
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

  useEffect(() => {
    if (location.state?.chargeId) {
      setChargeId(String(location.state.chargeId));
      setDrawerOpen(true);
    }
  }, [location.state]);

  function openCreate() {
    setChargeId("");
    setPaymentDate(today());
    setNotes("");
    setFormError(null);
    setDrawerOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (!selectedCharge) {
      setFormError(t("payments.errors.mustSelectCharge"));
      return;
    }

    setSaving(true);
    try {
      // Pago único: siempre el importe completo del cargo, sin permitir edición.
      await paymentsApi.create({
        charge_id: selectedCharge.id,
        amount: selectedCharge.amount,
        payment_date: paymentDate,
        notes
      });
      toast.success(t("payments.success", { id: selectedCharge.id }));
      setDrawerOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1>{t("payments.title")}</h1>
          <p className="page__subtitle">{t("payments.subtitle")}</p>
        </div>
        <div className="page__header-actions">
          <button className="btn btn--primary" onClick={openCreate} disabled={pendingCharges.length === 0}>
            <Plus size={15} /> {t("payments.registerTitle")}
          </button>
        </div>
      </header>

      <Banner kind="error">{error}</Banner>

      <section className="panel">
        <div className="panel__header">
          <h2>{t("payments.history")}</h2>
        </div>
        {loading ? (
          <SkeletonTable rows={4} columns={4} />
        ) : payments.length === 0 ? (
          <EmptyState icon={Wallet} title={t("payments.empty.title")} body={t("payments.empty.body")} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("payments.columns.id")}</th>
                  <th>{t("payments.columns.charge")}</th>
                  <th>{t("payments.columns.date")}</th>
                  <th>{t("payments.columns.amount")}</th>
                  <th>{t("payments.columns.notes")}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td data-label={t("payments.columns.id")}>{payment.id}</td>
                    <td data-label={t("payments.columns.charge")}>#{payment.charge_id}</td>
                    <td data-label={t("payments.columns.date")}>
                      {formatDate(payment.payment_date, i18n.language)}
                    </td>
                    <td data-label={t("payments.columns.amount")}>
                      <Money value={payment.amount} />
                    </td>
                    <td data-label={t("payments.columns.notes")}>{payment.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={t("payments.registerTitle")}>
        {pendingCharges.length === 0 ? (
          <p className="muted">{t("payments.empty.noPendingCharges")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="form">
            <Banner kind="error">{formError}</Banner>

            <label className="field">
              <span>{t("payments.selectCharge")}</span>
              <select value={chargeId} onChange={(e) => setChargeId(e.target.value)} required>
                <option value="" disabled>
                  {t("payments.selectChargePlaceholder")}
                </option>
                {pendingCharges.map((charge) => (
                  <option key={charge.id} value={charge.id}>
                    #{charge.id} — {charge.tenant_name || `#${charge.tenant_id}`} —{" "}
                    {formatMoney(charge.amount, i18n.language)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>{t("payments.amountLabel")}</span>
              <input value={selectedCharge ? formatMoney(selectedCharge.amount, i18n.language) : ""} readOnly disabled />
              <span className="field__hint">
                <Lock size={11} style={{ verticalAlign: "-1px", marginRight: 4 }} />
                {t("payments.singlePaymentNotice")}
              </span>
            </label>

            <label className="field">
              <span>{t("payments.date")}</span>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>{t("payments.notes")}</span>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>

            <div className="form__actions">
              <button className="btn btn--primary" type="submit" disabled={saving || !selectedCharge}>
                {saving ? t("payments.submitting") : t("payments.submit")}
              </button>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  );
}
