import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserRole } from "@/lib/api";

const Register = () => {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [ngoName, setNgoName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("donor");
  const [submitting, setSubmitting] = useState(false);

  const navigateByRole = (userRole: UserRole) => {
    if (userRole === "ngo") navigate("/ngo-dashboard");
    else if (userRole === "admin") navigate("/admin-dashboard");
    else navigate("/donor-dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "ngo" && !ngoName.trim()) {
      toast.error("NGO Name is required for NGO sign up.");
      return;
    }

    try {
      setSubmitting(true);
      const user = await register(name, email, password, role, role === "ngo" ? ngoName.trim() : undefined);
      navigateByRole(user.role);
      toast.success("Account created successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to register.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-heading font-bold">{t("auth.register")}</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {role === "ngo" ? "User Name" : t("auth.name")}
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>
            {role === "ngo" && (
              <div>
                <label className="block text-sm font-medium mb-1.5">NGO Name</label>
                <input
                  required
                  value={ngoName}
                  onChange={(e) => setNgoName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="Enter NGO / Trust name"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("auth.email")}</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("auth.password")}</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("auth.role")}</label>
              <div className="grid grid-cols-3 gap-2">
                {(["donor", "ngo", "admin"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                      role === r ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-muted"
                    }`}
                  >
                    {t(`auth.${r}`)}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Creating account..." : t("auth.register")}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("auth.hasAccount")}{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              {t("nav.login")}
            </Link>
          </p>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Register;
