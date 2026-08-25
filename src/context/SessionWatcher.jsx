import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./ToastContext";

export default function SessionWatcher() {
  const { logout, token } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    function handleUnauthorized() {
      if (!token) return;
      logout();
      toast.error(t("common.feedback.sessionExpired"));
      navigate("/login", { replace: true });
    }
    window.addEventListener("inquicontrol:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("inquicontrol:unauthorized", handleUnauthorized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return null;
}
