import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ActivitySquare, ArrowRight } from "lucide-react";
import { metersApi, meterReadingsApi } from "../api/endpoints";
import Banner from "../components/Banner";
import EmptyState from "../components/EmptyState";
import { SkeletonTable } from "../components/Skeleton";
import { formatDate } from "../utils/format";
import { usePageMeta } from "../context/PageMetaContext";
import { ApiError } from "../api/client";

export default function Readings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  usePageMeta({ title: t("readings.title") }, [t]);

  const [meters, setMeters] = useState([]);
  const [latestByMeter, setLatestByMeter] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [metersRes, readingsRes] = await Promise.all([metersApi.list(), meterReadingsApi.list()]);
        const readings = readingsRes.meter_readings || [];
        const latest = {};
        readings.forEach((r) => {
          const current = latest[r.meter_id];
          if (!current || new Date(r.reading_date) > new Date(current.reading_date)) {
            latest[r.meter_id] = r;
          }
        });
        setMeters(metersRes.meters || []);
        setLatestByMeter(latest);
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
          <h1>{t("readings.title")}</h1>
          <p className="page__subtitle">{t("readings.subtitle")}</p>
        </div>
      </header>

      <Banner kind="error">{error}</Banner>

      <section className="panel">
        {loading ? (
          <SkeletonTable rows={4} columns={4} />
        ) : meters.length === 0 ? (
          <EmptyState icon={ActivitySquare} title={t("meters.empty.title")} body={t("meters.empty.body")} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("meters.columns.code")}</th>
                  <th>{t("meters.columns.type")}</th>
                  <th>{t("readings.currentReading")}</th>
                  <th>{t("readings.date")}</th>
                  <th aria-label="acciones"></th>
                </tr>
              </thead>
              <tbody>
                {meters.map((meter) => {
                  const last = latestByMeter[meter.id];
                  return (
                    <tr
                      key={meter.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/meters/${meter.id}/readings`)}
                    >
                      <td data-label={t("meters.columns.code")}>
                        <span className="link">{meter.code}</span>
                      </td>
                      <td data-label={t("meters.columns.type")}>
                        {t(`common.serviceType.${meter.type}`, { defaultValue: meter.type })}
                      </td>
                      <td data-label={t("readings.currentReading")}>
                        {last ? `${last.reading} ${meter.measurement_unit}` : "—"}
                      </td>
                      <td data-label={t("readings.date")}>
                        {last ? formatDate(last.reading_date, i18n.language) : "—"}
                      </td>
                      <td className="table__actions">
                        <button className="btn btn--small">
                          {t("readings.history")} <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
