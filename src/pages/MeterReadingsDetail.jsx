import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ActivitySquare, Plus, Gauge } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import { metersApi, meterReadingsApi } from "../api/endpoints";
import Banner from "../components/Banner";
import Drawer from "../components/Drawer";
import EmptyState from "../components/EmptyState";
import { SkeletonTable } from "../components/Skeleton";
import { formatDate } from "../utils/format";
import { useToast } from "../context/ToastContext";
import { usePageMeta } from "../context/PageMetaContext";
import { ApiError } from "../api/client";

const today = () => new Date().toISOString().substring(0, 10);

export default function MeterReadingsDetail() {
  const { t, i18n } = useTranslation();
  const { meterId } = useParams();
  const toast = useToast();

  const [meter, setMeter] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [readingValue, setReadingValue] = useState("");
  const [readingDate, setReadingDate] = useState(today());
  const [photo, setPhoto] = useState(null);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  usePageMeta(
    {
      title: meter ? meter.code : "",
      breadcrumb: [{ label: t("meters.title"), to: "/meters" }, { label: meter ? meter.code : "" }]
    },
    [meter, t]
  );

  async function load() {
    setLoading(true);
    try {
      const [meterRes, readingsRes] = await Promise.all([
        metersApi.get(meterId),
        meterReadingsApi.listByMeter(meterId)
      ]);
      setMeter(meterRes.meter);
      setReadings(readingsRes.meter_readings || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meterId]);

  // Ordenadas de más reciente a más antigua (igual que el backend las devuelve)
  const sortedDesc = useMemo(
    () =>
      [...readings].sort(
        (a, b) => new Date(b.reading_date) - new Date(a.reading_date) || b.id - a.id
      ),
    [readings]
  );
  const lastReading = sortedDesc[0] || null;

  // Ascendente + consumo calculado en cliente, para el gráfico e historial
  const chronological = useMemo(() => {
    const asc = [...readings].sort(
      (a, b) => new Date(a.reading_date) - new Date(b.reading_date) || a.id - b.id
    );
    return asc.map((r, i) => ({
      ...r,
      previous: i > 0 ? Number(asc[i - 1].reading) : null,
      consumption: i > 0 ? Number(r.reading) - Number(asc[i - 1].reading) : null
    }));
  }, [readings]);

  const chartData = chronological
    .filter((r) => r.consumption !== null)
    .map((r) => ({
      date: formatDate(r.reading_date, i18n.language),
      consumo: Number(r.consumption.toFixed(2))
    }));

  const previewConsumption =
    lastReading && readingValue !== "" && !Number.isNaN(Number(readingValue))
      ? Number(readingValue) - Number(lastReading.reading)
      : null;

  function openDrawer() {
    setReadingValue("");
    setReadingDate(today());
    setPhoto(null);
    setFormError(null);
    setDrawerOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    const numeric = Number(readingValue);
    if (readingValue === "" || Number.isNaN(numeric)) {
      setFormError(t("readings.errors.selectMeter"));
      return;
    }
    if (lastReading && numeric < Number(lastReading.reading)) {
      setFormError(t("readings.errors.lowerThanPrevious"));
      return;
    }

    setSaving(true);
    try {
      await meterReadingsApi.create({
        meter_id: Number(meterId),
        reading: numeric,
        reading_date: readingDate,
        photo_url: null
      });
      toast.success(t("readings.form.submit"));
      setDrawerOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setFormError(t("readings.errors.lowerThanPrevious"));
      } else {
        setFormError(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="section-title">
            <Gauge size={20} /> {loading ? "…" : meter?.code}
          </h1>
          <p className="page__subtitle">
            {meter &&
              `${t(`common.serviceType.${meter.type}`, { defaultValue: meter.type })} · ${meter.measurement_unit} · ${meter.provider || "—"}`}
          </p>
        </div>
        <div className="page__header-actions">
          <button className="btn btn--primary" onClick={openDrawer}>
            <Plus size={15} /> {t("readings.register")}
          </button>
        </div>
      </header>

      <Banner kind="error">{error}</Banner>

      {!loading && lastReading && (
        <div className="reading-preview">
          <div className="reading-preview__item">
            <span className="reading-preview__label">{t("readings.previousReading")}</span>
            <span className="reading-preview__value">
              {chronological.length > 1
                ? `${chronological[chronological.length - 2].reading} ${meter?.measurement_unit}`
                : "—"}
            </span>
          </div>
          <div className="reading-preview__item">
            <span className="reading-preview__label">{t("readings.currentReading")}</span>
            <span className="reading-preview__value">
              {lastReading.reading} {meter?.measurement_unit}
            </span>
          </div>
          <div className="reading-preview__item">
            <span className="reading-preview__label">{t("readings.consumption")}</span>
            <span className="reading-preview__value reading-preview__value--accent">
              {chronological[chronological.length - 1]?.consumption !== null
                ? `${chronological[chronological.length - 1].consumption.toFixed(2)} ${meter?.measurement_unit}`
                : "—"}
            </span>
          </div>
        </div>
      )}

      {!loading && chartData.length > 1 && (
        <section className="chart-card">
          <h2 style={{ marginBottom: 12 }}>{t("readings.chartTitle")}</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--ink-soft)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--ink-soft)" />
              <Tooltip
                formatter={(value) => [`${value} ${meter?.measurement_unit}`, t("readings.consumption")]}
              />
              <Line type="monotone" dataKey="consumo" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      <section className="panel">
        <div className="panel__header">
          <h2>{t("readings.history")}</h2>
        </div>
        {loading ? (
          <SkeletonTable rows={3} columns={3} />
        ) : readings.length === 0 ? (
          <EmptyState
            icon={ActivitySquare}
            title={t("readings.empty.title")}
            body={t("readings.empty.body")}
            actionLabel={t("readings.empty.cta")}
            onAction={openDrawer}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("readings.date")}</th>
                  <th>{t("readings.currentReading")}</th>
                  <th>{t("readings.consumption")}</th>
                </tr>
              </thead>
              <tbody>
                {sortedDesc.map((r) => {
                  const match = chronological.find((c) => c.id === r.id);
                  return (
                    <tr key={r.id}>
                      <td data-label={t("readings.date")}>{formatDate(r.reading_date, i18n.language)}</td>
                      <td data-label={t("readings.currentReading")}>
                        {r.reading} {meter?.measurement_unit}
                      </td>
                      <td data-label={t("readings.consumption")}>
                        {match?.consumption !== null && match?.consumption !== undefined
                          ? `${match.consumption.toFixed(2)} ${meter?.measurement_unit}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={t("readings.register")}>
        <form onSubmit={handleSubmit} className="form">
          <Banner kind="error">{formError}</Banner>

          <label className="field">
            <span>{t("readings.form.reading")}</span>
            <input
              type="number"
              step="0.001"
              value={readingValue}
              onChange={(e) => setReadingValue(e.target.value)}
              required
            />
          </label>

          {previewConsumption !== null && (
            <div className="reading-preview">
              <div className="reading-preview__item">
                <span className="reading-preview__label">{t("readings.previousReading")}</span>
                <span className="reading-preview__value">
                  {lastReading.reading} {meter?.measurement_unit}
                </span>
              </div>
              <div className="reading-preview__item">
                <span className="reading-preview__label">{t("readings.currentReading")}</span>
                <span className="reading-preview__value">
                  {readingValue} {meter?.measurement_unit}
                </span>
              </div>
              <div className="reading-preview__item">
                <span className="reading-preview__label">{t("readings.consumption")}</span>
                <span
                  className="reading-preview__value"
                  style={{ color: previewConsumption < 0 ? "var(--danger)" : "var(--accent-dark)" }}
                >
                  {previewConsumption.toFixed(2)} {meter?.measurement_unit}
                </span>
              </div>
            </div>
          )}

          <label className="field">
            <span>{t("readings.form.date")}</span>
            <input
              type="date"
              value={readingDate}
              onChange={(e) => setReadingDate(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>{t("readings.form.photo")}</span>
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
            <span className="field__hint">{t("readings.form.photoHint")}</span>
          </label>

          <div className="form__actions">
            <button className="btn btn--primary" type="submit" disabled={saving}>
              {saving ? t("common.feedback.saving") : t("readings.form.submit")}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
