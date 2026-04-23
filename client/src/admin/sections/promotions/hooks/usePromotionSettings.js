import { useState, useEffect, useCallback } from "react";
import {
  getPromotionSettings,
  updatePromotionSettings,
  getPromotionHistory,
} from "../../../../services/adminPromotionApi";

export default function usePromotionSettings() {
  const [settings, setSettings] = useState(null);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  /* ---------------- FETCH SETTINGS ---------------- */
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getPromotionSettings();
      setSettings(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------- SAVE SETTINGS ---------------- */
  const saveSettings = async (payload, notes = "") => {
    try {
      setSaving(true);
      setError(null);

      await updatePromotionSettings({
        ...payload,
        notes,
      });

      setSuccessMsg("Settings updated successfully ✅");
      await fetchSettings();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- HISTORY ---------------- */
  const fetchHistory = async () => {
    try {
      const res = await getPromotionHistory();
      setHistory(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccessMsg("");
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    history,
    loading,
    saving,
    error,
    successMsg,
    fetchSettings,
    saveSettings,
    fetchHistory,
    clearMessages,
  };
}