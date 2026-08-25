import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";
import { fetchAllTenants } from "../utils/aggregate";
import { chargesApi, paymentsApi } from "../api/endpoints";
import Banner from "../components/Banner";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { SkeletonTable } from "../components/Skeleton";
import { usePageMeta } from "../context/PageMetaContext";
import { ApiError } from "../api/client";

export default function Tenants() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  usePageMeta({ title: t("tenants.title") }, [t]);

  const [tenants, setTenants] = useState([]);
  const [pendingByTenant, setPendingByTenant] = useState({});
  const [paidByTenant, setPaidByTenant] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [{ tenants: allTenants }, chargesRes, paymentsRes] = await Promise.all([
          fetchAllTenants(),
          chargesApi.list(),
          paymentsApi.list()
        ]);

        const pendingMap = {};
        (chargesRes.charges || [])
          .filter((c) => c.status === "PENDING")
          .forEach((c) => {
            pendingMap[c.tenant_id] = (pendingMap[c.tenant_id] || 0) + 1;
          });

        const chargeToTenant = {};
        (chargesRes.charges || []).forEach((c) => {
          chargeToTenant[c.id] = c.tenant_id;
        });
        const paidMap = {};
        (paymentsRes.payments || []).forEach((p) => {
          const tenantId = chargeToTenant[p.charge_id];
          if (!tenantId) return;
          paidMap[tenantId] = (paidMap[tenantId] || 0) + 1;
        });

        setTenants(allTenants);
        setPendingByTenant(pendingMap);
        setPaidByTenant(paidMap);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [t]);

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1>{t("tenants.title")}</h1>
          <p className="page__subtitle">{t("tenants.subtitle")}</p>
        </div>
      </header>

      <Banner kind="error">{error}</Banner>

      <section className="panel">
        {loading ? (
          <SkeletonTable rows={5} columns={5} />
        ) : tenants.length === 0 ? (
          <EmptyState icon={Users} title={t("tenants.empty.title")} body={t("tenants.empty.body")} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("tenants.columns.name")}</th>
                  <th>{t("tenants.columns.unit")}</th>
                  <th>{t("tenants.columns.status")}</th>
                  <th>{t("tenants.columns.pendingCharges")}</th>
                  <th>{t("tenants.columns.paymentsMade")}</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/tenants/${tenant.id}`)}>
                    <td data-label={t("tenants.columns.name")}>
                      <span className="link">
                        {tenant.name} {tenant.lastname}
                      </span>
                    </td>
                    <td data-label={t("tenants.columns.unit")}>
                      {tenant.unit.name} · {tenant.unit.property.name}
                    </td>
                    <td data-label={t("tenants.columns.status")}>
                      <StatusBadge status={tenant.status} />
                    </td>
                    <td data-label={t("tenants.columns.pendingCharges")}>{pendingByTenant[tenant.id] || 0}</td>
                    <td data-label={t("tenants.columns.paymentsMade")}>{paidByTenant[tenant.id] || 0}</td>
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
