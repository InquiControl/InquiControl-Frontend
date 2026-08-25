import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Home, Check, Building2, Gauge } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Banner from "../components/Banner";
import { ApiError } from "../api/client";

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const lengthOk = password.length >= 8;

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (!name || !email || !password) {
      setError(t("auth.errors.requiredFields"));
      return;
    }
    if (!lengthOk) {
      setError(t("auth.errors.passwordTooShort"));
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(t("auth.errors.emailInUse"));
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
          <span className="brand__mark">
            <Home size={18} strokeWidth={2.2} />
          </span>
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
            <span className="brand__mark">
              <Home size={17} strokeWidth={2.2} />
            </span>
            <div>
              <div className="brand__name">{t("common.app.name")}</div>
            </div>
          </div>

          <div>
            <h1 className="auth-card__title">{t("auth.register.title")}</h1>
            <p className="auth-card__subtitle">{t("auth.register.subtitle")}</p>
          </div>

          <Banner kind="error">{error}</Banner>

          <form onSubmit={handleSubmit} className="form">
            <label className="field">
              <span>{t("auth.register.name")}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </label>

            <label className="field">
              <span>{t("auth.register.email")}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label className="field field-password">
              <span>{t("auth.register.password")}</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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
              <span className={"requirement" + (lengthOk ? " requirement--met" : "")}>
                <Check size={13} />
                {t("auth.register.requirementLength")}
              </span>
            </label>

            <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
              {loading ? t("auth.register.submitting") : t("auth.register.submit")}
            </button>
          </form>

          <p className="muted" style={{ textAlign: "center", fontSize: 13.5 }}>
            {t("auth.register.hasAccount")}{" "}
            <Link className="link" to="/login">
              {t("auth.register.loginLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
