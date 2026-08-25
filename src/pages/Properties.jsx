import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import { propertiesApi } from "../api/endpoints";
import { fetchPropertiesWithUnits } from "../utils/aggregate";
import Banner from "../components/Banner";
import Drawer from "../components/Drawer";
import EmptyState from "../components/EmptyState";
import { SkeletonCards } from "../components/Skeleton";
import { useConfirm } from "../context/ConfirmContext";
import { useToast } from "../context/ToastContext";
import { ApiError } from "../api/client";
import { usePageMeta } from "../context/PageMetaContext";

const EMPTY_FORM = { name: "", address: "" };

export default function Properties() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();

  usePageMeta({ title: t("properties.title") }, [t]);

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const withUnits = await fetchPropertiesWithUnits();
      setProperties(withUnits);
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

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  }

  function openEdit(property, e) {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(property.id);
    setForm({ name: property.name, address: property.address || "" });
    setDrawerOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await propertiesApi.update(editingId, form);
        toast.success(t("common.actions.saveChanges"));
      } else {
        await propertiesApi.create(form);
        toast.success(t("properties.new"));
      }
      setDrawerOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(property, e) {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = await confirm({
      title: t("properties.deleteConfirm.title"),
      body: t("properties.deleteConfirm.body", { name: property.name })
    });
    if (!confirmed) return;
    try {
      await propertiesApi.remove(property.id);
      toast.success(t("common.actions.delete"));
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.feedback.networkError"));
    }
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1>{t("properties.title")}</h1>
          <p className="page__subtitle">{t("properties.subtitle")}</p>
        </div>
        <div className="page__header-actions">
          <button className="btn btn--primary" onClick={openCreate}>
            <Plus size={15} /> {t("properties.new")}
          </button>
        </div>
      </header>

      <Banner kind="error">{error}</Banner>

      {loading ? (
        <SkeletonCards count={3} />
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t("properties.empty.title")}
          body={t("properties.empty.body")}
          actionLabel={t("properties.empty.cta")}
          onAction={openCreate}
        />
      ) : (
        <div className="card-grid">
          {properties.map((property) => {
            const total = property.units.length;
            const occupied = property.units.filter((u) => u.status === "OCCUPIED").length;
            const available = total - occupied;
            const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
            return (
              <a
                key={property.id}
                href={`/properties/${property.id}`}
                className="property-card"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/properties/${property.id}`);
                }}
              >
                <div className="property-card__header">
                  <div>
                    <div className="property-card__name">{property.name}</div>
                    <div className="property-card__address">{property.address || "—"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button className="icon-btn" onClick={(e) => openEdit(property, e)} aria-label="edit">
                      <Pencil size={15} />
                    </button>
                    <button className="icon-btn" onClick={(e) => handleDelete(property, e)} aria-label="delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="occupancy-bar">
                  <div className="occupancy-bar__fill" style={{ width: `${pct}%` }} />
                </div>

                <div className="property-card__stats">
                  <span>
                    <strong>{total}</strong> {t("properties.card.units")}
                  </span>
                  <span>
                    <strong>{occupied}</strong> {t("properties.card.occupied")}
                  </span>
                  <span>
                    <strong>{available}</strong> {t("properties.card.available")}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? t("properties.edit") : t("properties.new")}
      >
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>{t("properties.fields.name")}</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="field">
            <span>{t("properties.fields.address")}</span>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>
          <div className="form__actions">
            <button className="btn btn--primary" type="submit" disabled={saving}>
              {saving ? t("common.feedback.saving") : editingId ? t("common.actions.saveChanges") : t("common.actions.create")}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
