import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Home, Building2, Gauge } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Banner from "../components/Banner";
import { ApiError } from "../api/client";

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await login(email, password, remember);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(t("auth.errors.invalidCredentials"));
      } else {
        setError(t("common.feedback.networkError"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-screen__visual blueprint-texture">
        <div className="auth-visual__brand">
          <div>
            <div className="brand__name">{t("common.app.name")}</div>
            <div className="brand__sub">{t("common.app.tagline")}</div>
          </div>
        </div>

        <div>
          <h1 className="auth-visual__headline">{t("auth.login.visualTitle")}</h1>
          <p className="auth-visual__body">{t("auth.login.visualBody")}</p>
        </div>

        <div className="auth-visual__stats">
          <div>
            <div className="auth-visual__stat-value">
              <Building2 size={22} />
            </div>
            <div className="auth-visual__stat-label">{t("auth.login.visualStat1Label")}</div>
          </div>
          <div>
            <div className="auth-visual__stat-value">
              <Gauge size={22} />
            </div>
            <div className="auth-visual__stat-label">{t("auth.login.visualStat2Label")}</div>
          </div>
        </div>
      </div>

      <div className="auth-screen__form-side">
        <div className="auth-card">
          <div className="auth-card__mobile-brand">
            <div>
              <div className="brand__name">{t("common.app.name")}</div>
            </div>
          </div>

          <div>
            <h1 className="auth-card__title">{t("auth.login.title")}</h1>
            <p className="auth-card__subtitle">{t("auth.login.subtitle")}</p>
          </div>

          <Banner kind="error">{error}</Banner>

          <form onSubmit={handleSubmit} className="form">
            <label className="field">
              <span>{t("auth.login.email")}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label className="field field-password">
              <span>{t("auth.login.password")}</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="field-password__toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? t("auth.login.hidePassword") : t("auth.login.showPassword")}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </label>

            <label className="checkbox-field">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              {t("auth.login.rememberMe")}
            </label>

            <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
              {loading ? t("auth.login.submitting") : t("auth.login.submit")}
            </button>
          </form>

          <p className="muted" style={{ textAlign: "center", fontSize: 13.5 }}>
            {t("auth.login.noAccount")}{" "}
            <Link className="link" to="/register">
              {t("auth.login.registerLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
