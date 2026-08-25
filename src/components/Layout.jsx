import { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  Gauge,
  ActivitySquare,
  Receipt,
  FileText,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  ChevronDown,
  Home
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import { useToast } from "../context/ToastContext";
import { usePageMetaState } from "../context/PageMetaContext";
import LanguageSwitcher from "./LanguageSwitcher";

const NAV_ITEMS = [
  { to: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { to: "/properties", key: "properties", icon: Building2 },
  { to: "/units", key: "units", icon: DoorOpen },
  { to: "/tenants", key: "tenants", icon: Users },
  { to: "/meters", key: "meters", icon: Gauge },
  { to: "/readings", key: "readings", icon: ActivitySquare },
  { to: "/utility-bills", key: "utilityBills", icon: Receipt },
  { to: "/charges", key: "charges", icon: FileText },
  { to: "/payments", key: "payments", icon: Wallet }
];

export default function Layout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { meta } = usePageMetaState();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleLogout() {
    setUserMenuOpen(false);
    const confirmed = await confirm({
      title: t("auth.logout.confirmTitle"),
      body: t("auth.logout.confirmBody"),
      confirmLabel: t("auth.logout.action"),
      danger: false
    });
    if (!confirmed) return;
    logout();
    toast.success(t("auth.logout.action"));
    navigate("/login", { replace: true });
  }

  const activeItem = NAV_ITEMS.find((item) => location.pathname.startsWith(item.to));
  const pageTitle = meta?.title || (activeItem ? t(`common.nav.${activeItem.key}`) : "");
  const breadcrumb = meta?.breadcrumb;

  return (
    <div className={"shell" + (collapsed ? " shell--collapsed" : "")}>
      {mobileOpen && <div className="mobile-sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside
        className={
          "sidebar" +
          (collapsed ? " sidebar--collapsed" : "") +
          (mobileOpen ? " sidebar--mobile-open" : "")
        }
      >
        <div className="brand">
          <div>
            <div className="brand__name">{t("common.app.name")}</div>
            <div className="brand__sub">{t("common.app.tagline")}</div>
          </div>
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? t("common.nav.expand") : t("common.nav.collapse")}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        <nav className="nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => "nav__item" + (isActive ? " nav__item--active" : "")}
                title={collapsed ? t(`common.nav.${item.key}`) : undefined}
              >
                <Icon size={17} strokeWidth={2} />
                <span className="nav__label">{t(`common.nav.${item.key}`)}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          {!collapsed && (
            <div style={{ padding: "0 6px" }}>
              <LanguageSwitcher />
            </div>
          )}
        </div>
      </aside>

      <div>
        <header className="topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="menu">
            <Menu size={20} />
          </button>

          <div className="topbar__section" style={{ flex: 1, marginLeft: 8 }}>
            {breadcrumb && breadcrumb.length > 0 && (
              <div className="breadcrumb">
                {breadcrumb.map((crumb, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {i > 0 && <span className="breadcrumb__sep">/</span>}
                    {crumb.to ? (
                      <button className="link-button" style={{ margin: 0 }} onClick={() => navigate(crumb.to)}>
                        {crumb.label}
                      </button>
                    ) : (
                      <span>{crumb.label}</span>
                    )}
                  </span>
                ))}
              </div>
            )}
            <div className="topbar__title">{pageTitle}</div>
          </div>

          <div className="topbar__right">
            <div className="user-menu" ref={userMenuRef}>
              <button className="user-menu__trigger" onClick={() => setUserMenuOpen((o) => !o)}>
                <span className="avatar">{(user?.name || "?").charAt(0).toUpperCase()}</span>
                <span className="user-menu__name">{user?.name}</span>
                <ChevronDown size={14} />
              </button>
              {userMenuOpen && (
                <div className="user-menu__panel">
                  <div className="user-menu__email">{user?.email}</div>
                  <button className="user-menu__item" onClick={handleLogout}>
                    <LogOut size={15} />
                    {t("auth.logout.action")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
