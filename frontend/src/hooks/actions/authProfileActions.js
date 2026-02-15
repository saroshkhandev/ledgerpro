import api from "../../api/client";

export default function createAuthProfileActions({ navigate, apiMsg, profileForm, setBusy, setAuthMsg, setMe, boot }) {
  const onRegister = async (payload) => {
    setBusy((prev) => ({ ...prev, register: true }));
    try {
      await api.post("/auth/register", payload);
      setAuthMsg("");
      await boot();
      navigate("/dashboard");
      return true;
    } catch (err) {
      setAuthMsg(err?.response?.data?.error || "Registration failed");
      return false;
    } finally {
      setBusy((prev) => ({ ...prev, register: false }));
    }
  };

  const onLogin = async (payload) => {
    setBusy((prev) => ({ ...prev, login: true }));
    try {
      await api.post("/auth/login", payload);
      setAuthMsg("");
      await boot();
      navigate("/dashboard");
      return true;
    } catch (err) {
      setAuthMsg(err?.response?.data?.error || "Login failed");
      return false;
    } finally {
      setBusy((prev) => ({ ...prev, login: false }));
    }
  };

  const onLogout = async () => {
    setBusy((prev) => ({ ...prev, logout: true }));
    try {
      await api.post("/auth/logout");
      setMe(null);
      navigate("/login");
    } finally {
      setBusy((prev) => ({ ...prev, logout: false }));
    }
  };

  const saveProfile = async () => {
    setBusy((prev) => ({ ...prev, profile: true }));
    try {
      const res = await api.put("/auth/profile", profileForm);
      setMe(res.data.item);
      apiMsg.success("Profile updated");
      return true;
    } catch (err) {
      apiMsg.error(err?.response?.data?.error || "Failed to update profile");
      return false;
    } finally {
      setBusy((prev) => ({ ...prev, profile: false }));
    }
  };

  return { onRegister, onLogin, onLogout, saveProfile };
}
