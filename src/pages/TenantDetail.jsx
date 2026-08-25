import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, DoorOpen } from "lucide-react";
import { tenantsApi, chargesApi, paymentsApi } from "../api/endpoints";
import Banner from "../components/Banner";
import StatusBadge from "../components/StatusBadge";
import Money from "../components/Money";
import { SkeletonTable } from "../components/Skeleton";
import { formatDate } from "../utils/format";
import { usePageMeta } from "../context/PageMetaContext";
import { ApiError } from "../api/client";

export default function TenantDetail() {
  const { t, i18n } = useTranslation();
  const { tenantId } = useParams();

  const [tenant, setTenant] = useState(null);
  const [charges, setCharges] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  usePageMeta(
    {
      title: tenant ? `${tenant.name} ${tenant.lastname}` : "",
      breadcrumb: [
        { label: t("tenants.title"), to: "/tenants" },
        { label: tenant ? `${tenant.name} ${tenant.lastname}` : "" }
      ]
    },
    [tenant, t]
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [tenantRes, chargesRes, paymentsRes] = await Promise.all([
          tenantsApi.get(tenantId),
          chargesApi.list(),
          paymentsApi.list()
        ]);
        const myCharges = (chargesRes.charges || []).filter((c) => c.tenant_id === Number(tenantId));
        const myChargeIds = new Set(myCharges.map((c) => c.id));
        setTenant(tenantRes.tenant);
        setCharges(myCharges);
        setPayments((paymentsRes.payments || []).filter((p) => myChargeIds.has(p.charge_id)));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1>{loading ? "…" : `${tenant?.name} ${tenant?.lastname}`}</h1>
          {!loading && <StatusBadge status={tenant?.status} />}
        </div>
      </header>

      <Banner kind="error">{error}</Banner>

      <div className="two-col">
        <section className="panel">
          <div className="panel__header">
            <h2 className="section-title">
              <User size={16} /> {t("tenants.detail.personalInfo")}
            </h2>
          </div>
          {!loading && tenant && (
            <div className="form" style={{ gap: 8 }}>
              <div>
                <span className="field__hint">{t("tenants.form.dni")}: </span>
                {tenant.dni || "—"}
              </div>
              <div>
                <span className="field__hint">{t("tenants.form.phone")}: </span>
                {tenant.phone || "—"}
              </div>
              <div>
                <span className="field__hint">{t("tenants.form.startDate")}: </span>
                {formatDate(tenant.start_date, i18n.language)}
              </div>
              <div>
                <span className="field__hint">{t("tenants.form.endDate")}: </span>
                {tenant.end_date ? formatDate(tenant.end_date, i18n.language) : "—"}
              </div>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <h2 className="section-title">
              <DoorOpen size={16} /> {t("tenants.detail.unitInfo")}
            </h2>
          </div>
          <p className="muted">#{tenant?.unit_id}</p>
        </section>
      </div>

      <section className="panel">
        <div className="panel__header">
          <h2>{t("tenants.detail.chargeHistory")}</h2>
        </div>
        {loading ? (
          <SkeletonTable rows={3} columns={3} />
        ) : charges.length === 0 ? (
          <p className="muted">{t("tenants.detail.chargesEmpty")}</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t("charges.columns.amount")}</th>
                  <th>{t("charges.columns.status")}</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((charge) => (
                  <tr key={charge.id}>
                    <td data-label="#">{charge.id}</td>
                    <td data-label={t("charges.columns.amount")}>
                      <Money value={charge.amount} />
                    </td>
                    <td data-label={t("charges.columns.status")}>
                      <StatusBadge status={charge.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel__header">
          <h2>{t("tenants.detail.paymentHistory")}</h2>
        </div>
        {loading ? (
          <SkeletonTable rows={3} columns={3} />
        ) : payments.length === 0 ? (
          <p className="muted">{t("tenants.detail.paymentsEmpty")}</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("payments.columns.date")}</th>
                  <th>{t("payments.columns.charge")}</th>
                  <th>{t("payments.columns.amount")}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td data-label={t("payments.columns.date")}>
                      {formatDate(payment.payment_date, i18n.language)}
                    </td>
                    <td data-label={t("payments.columns.charge")}>#{payment.charge_id}</td>
                    <td data-label={t("payments.columns.amount")}>
                      <Money value={payment.amount} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
