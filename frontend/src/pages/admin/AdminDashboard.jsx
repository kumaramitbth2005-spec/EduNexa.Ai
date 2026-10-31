import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../../services';
import StatCard from '../../components/common/StatCard';
import {
  Shield, Users, BookOpen, UserCheck, TrendingUp,
  Settings, ArrowRight, Activity, AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend
} from 'recharts';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await userService.getAdminStats();
      setStats(res.data.stats);
    } catch {
      toast.error('Failed to load administrative analytics');
    } finally {
      setLoading(false);
    }
  };

  const roleChartData = stats
    ? [
        { name: 'Students', value: stats.totalStudents || 0, color: '#6366f1' },
        { name: 'Teachers', value: stats.totalTeachers || 0, color: '#10b981' },
        { name: 'Admins', value: stats.totalAdmins || 0, color: '#f59e0b' },
      ]
    : [];

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-red-600 via-rose-700 to-indigo-800 text-white p-6 md:p-8 shadow-xl">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold w-max mb-3">
          <Shield className="w-3.5 h-3.5" />
          <span>Platform Administrator Level Access</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          System Administration & Governance
        </h1>
        <p className="mt-2 text-rose-100 text-sm max-w-xl">
          Oversee institutional users, manage educator privileges, inspect curriculum quality, and review platform security.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={loading ? '...' : stats?.totalStudents || 0}
          icon={Users}
          color="primary"
          subtitle="Registered learners"
        />
        <StatCard
          title="Faculty / Educators"
          value={loading ? '...' : stats?.totalTeachers || 0}
          icon={UserCheck}
          color="green"
          subtitle="Course creators"
        />
        <StatCard
          title="Administrators"
          value={loading ? '...' : stats?.totalAdmins || 0}
          icon={Shield}
          color="amber"
          subtitle="System operators"
        />
        <StatCard
          title="New This Month"
          value={loading ? '...' : stats?.newUsersThisMonth || 0}
          icon={TrendingUp}
          color="purple"
          subtitle="Active user growth"
        />
      </div>

      {/* Analytics Breakdown & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Distribution Chart */}
        <div className="card p-6 lg:col-span-2 space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-500" />
            User Distribution
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            {roleChartData.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {roleChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-gray-400">Loading user distribution metrics...</p>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="card p-6 space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
            Admin Operations
          </h3>
          <div className="space-y-2">
            <Link
              to="/admin/users"
              className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-primary-50 dark:hover:bg-primary-950/40 border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors"
            >
              <span>User & Role Management</span>
              <ArrowRight className="w-4 h-4 text-primary-500" />
            </Link>
            <Link
              to="/courses"
              className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-primary-50 dark:hover:bg-primary-950/40 border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors"
            >
              <span>Audit Course Content</span>
              <ArrowRight className="w-4 h-4 text-primary-500" />
            </Link>
            <Link
              to="/community"
              className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-primary-50 dark:hover:bg-primary-950/40 border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors"
            >
              <span>Community Moderation</span>
              <ArrowRight className="w-4 h-4 text-primary-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

