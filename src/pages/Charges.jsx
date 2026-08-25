import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FileText, X } from "lucide-react";
import { chargesApi } from "../api/endpoints";
import Banner from "../components/Banner";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import Money from "../components/Money";
import { SkeletonTable } from "../components/Skeleton";
import { usePageMeta } from "../context/PageMetaContext";
import { ApiError } from "../api/client";

export default function Charges() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  usePageMeta({ title: t("charges.title") }, [t]);

  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [detailCharge, setDetailCharge] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await chargesApi.list();
        setCharges(res.charges || []);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [t]);

  const filtered = filter === "ALL" ? charges : charges.filter((c) => c.status === filter);

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1>{t("charges.title")}</h1>
          <p className="page__subtitle">{t("charges.subtitle")}</p>
        </div>
        <div className="segmented">
          {["ALL", "PENDING", "PAID"].map((option) => (
            <button
              key={option}
              className={"segmented__btn" + (filter === option ? " segmented__btn--active" : "")}
              onClick={() => setFilter(option)}
            >
              {option === "ALL"
                ? t("charges.filters.all")
                : option === "PENDING"
                ? t("charges.filters.pending")
                : t("charges.filters.paid")}
            </button>
          ))}
        </div>
      </header>

      <Banner kind="error">{error}</Banner>

      <section className="panel">
        {loading ? (
          <SkeletonTable rows={4} columns={6} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileText} title={t("charges.empty.title")} body={t("charges.empty.body")} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("charges.columns.id")}</th>
                  <th>{t("charges.columns.tenant")}</th>
                  <th>{t("charges.columns.bill")}</th>
                  <th>{t("charges.columns.amount")}</th>
                  <th>{t("charges.columns.status")}</th>
                  <th aria-label="acciones"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((charge) => (
                  <tr key={charge.id}>
                    <td data-label={t("charges.columns.id")}>{charge.id}</td>
                    <td data-label={t("charges.columns.tenant")}>
                      <button
                        className="link-button"
                        style={{ margin: 0 }}
                        onClick={() => navigate(`/tenants/${charge.tenant_id}`)}
                      >
                        {charge.tenant_name || `#${charge.tenant_id}`}
                      </button>
                    </td>
                    <td data-label={t("charges.columns.bill")}>
                      {charge.service
                        ? `${t(`common.serviceType.${charge.service}`, { defaultValue: charge.service })} · ${charge.period}`
                        : `#${charge.utility_bill_id}`}
                    </td>
                    <td data-label={t("charges.columns.amount")}>
                      <Money value={charge.amount} />
                    </td>
                    <td data-label={t("charges.columns.status")}>
                      <StatusBadge status={charge.status} />
                    </td>
                    <td className="table__actions">
                      <button className="btn btn--small" onClick={() => setDetailCharge(charge)}>
                        {t("common.actions.viewDetail")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {detailCharge && (
        <div className="modal-overlay" onMouseDown={() => setDetailCharge(null)}>
          <div
            className="confirm-dialog"
            style={{ maxWidth: 380, textAlign: "left" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="panel__header">
              <h2>{t("charges.detail.title")}</h2>
              <button className="icon-btn" onClick={() => setDetailCharge(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="form" style={{ gap: 10 }}>
              <div>
                <span className="field__hint">{t("charges.detail.tenant")}: </span>
                {detailCharge.tenant_name || `#${detailCharge.tenant_id}`}
              </div>
              <div>
                <span className="field__hint">{t("charges.detail.relatedBill")}: </span>#
                {detailCharge.utility_bill_id}
              </div>
              {detailCharge.period && (
                <div>
                  <span className="field__hint">{t("charges.detail.period")}: </span>
                  {detailCharge.period}
                </div>
              )}
              <div>
                <span className="field__hint">{t("charges.detail.amount")}: </span>
                <Money value={detailCharge.amount} />
              </div>
              <div>
                <span className="field__hint">{t("charges.detail.status")}: </span>
                <StatusBadge status={detailCharge.status} />
              </div>
              {detailCharge.status === "PENDING" && (
                <button
                  className="btn btn--primary btn--full"
                  onClick={() => navigate("/payments", { state: { chargeId: detailCharge.id } })}
                >
                  {t("charges.registerPayment")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
