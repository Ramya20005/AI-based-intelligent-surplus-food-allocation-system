import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, Lock, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getAdminApplications,
  getAdminDonations,
  getAdminStats,
  type AdminApplication,
  type AdminDonation,
  type AdminStats,
} from "@/lib/api";

const emptyStats: AdminStats = {
  total: 0,
  safe: 0,
  moderate: 0,
  unsafe: 0,
  locked: 0,
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [rows, setRows] = useState<AdminDonation[]>([]);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [stats, setStats] = useState<AdminStats>(emptyStats);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsResponse, donationsResponse, applicationsResponse] = await Promise.all([
        getAdminStats(),
        getAdminDonations(),
        getAdminApplications(),
      ]);
      setStats(statsResponse.stats);
      setRows(donationsResponse.donations);
      setApplications(applicationsResponse.applications);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const localStats = useMemo(
    () => [
      { label: "Total Items", value: stats.total, color: "bg-primary/10 text-primary" },
      { label: "Safe", value: stats.safe, color: "status-safe" },
      { label: "Moderate", value: stats.moderate, color: "status-moderate" },
      { label: "Unsafe", value: stats.unsafe, color: "status-unsafe" },
    ],
    [stats],
  );

  const downloadCSV = () => {
    const headers = "Food Name,Image URL,Risk Score,Status,Donor,Locked By,Lock Time\n";
    const rowsData = rows
      .map((d) =>
        [d.name, d.imageUrl || "-", `${d.riskScore}%`, d.status, d.donorName, d.lockedBy || "-", d.lockTime || "-"].join(
          ",",
        ),
      )
      .join("\n");

    const blob = new Blob([headers + rowsData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "food_allocation_report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "safe") return <CheckCircle className="w-3 h-3" />;
    if (status === "moderate") return <AlertTriangle className="w-3 h-3" />;
    return <XCircle className="w-3 h-3" />;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-heading font-bold">{t("admin.title")}</h1>
            <p className="text-muted-foreground">
              {t("dash.welcome")}, {user?.name}
            </p>
          </div>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            {t("admin.download")}
          </button>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {localStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-4 text-center"
            >
              <p className="text-2xl font-heading font-bold">{stat.value}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${stat.color}`}>{stat.label}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium">Image</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">{t("food.name")}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">{t("admin.riskScore")}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">{t("admin.status")}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Donor</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">{t("admin.lockedBy")}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">{t("admin.lockTime")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      Loading report data...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No data available.
                    </td>
                  </tr>
                ) : (
                  rows.map((d) => (
                    <tr key={d.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        {d.imageUrl ? (
                          <a href={d.imageUrl} target="_blank" rel="noreferrer">
                            <img
                              src={d.imageUrl}
                              alt={d.name}
                              className="w-12 h-12 object-cover rounded-md border border-border"
                            />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">No image</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{d.name}</td>
                      <td className="px-4 py-3 text-sm">{d.riskScore}%</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                            d.status === "safe" ? "status-safe" : d.status === "moderate" ? "status-moderate" : "status-unsafe"
                          }`}
                        >
                          <StatusIcon status={d.status} />
                          {d.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{d.donorName}</td>
                      <td className="px-4 py-3 text-sm">
                        {d.lockedBy ? <Lock className="w-3 h-3 inline mr-1 text-muted-foreground" /> : null}
                        {d.lockedBy || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{d.lockTime || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card overflow-hidden mt-8"
        >
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-heading font-semibold">NGO Application Details</h2>
            <p className="text-xs text-muted-foreground">Shows who locked food, trust details, and collector contact.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium">Applied At</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Food</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">NGO Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Applicant</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Contact Person</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Contact Number</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Trust Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Trust Address</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Collector Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Collector Phone</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      Loading NGO application details...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No NGO applications yet.
                    </td>
                  </tr>
                ) : (
                  applications.map((application) => (
                    <tr key={application.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(application.appliedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2 min-w-[180px]">
                          {application.imageUrl ? (
                            <img
                              src={application.imageUrl}
                              alt={application.foodName}
                              className="w-10 h-10 rounded object-cover border border-border"
                            />
                          ) : null}
                          <div>
                            <p className="font-medium">{application.foodName}</p>
                            <p className="text-xs text-muted-foreground">ID: {application.donationId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{application.ngoName}</td>
                      <td className="px-4 py-3 text-sm">{application.applicantName}</td>
                      <td className="px-4 py-3 text-sm">{application.contactPersonName}</td>
                      <td className="px-4 py-3 text-sm">{application.contactNumber}</td>
                      <td className="px-4 py-3 text-sm">{application.email}</td>
                      <td className="px-4 py-3 text-sm">{application.trustName || application.ngoName || "-"}</td>
                      <td className="px-4 py-3 text-sm">{application.ngoAddress || "-"}</td>
                      <td className="px-4 py-3 text-sm">{application.collectorName}</td>
                      <td className="px-4 py-3 text-sm">{application.collectorPhone}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
