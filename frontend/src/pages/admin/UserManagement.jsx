import React, { useEffect, useState } from 'react';
import { userService } from '../../services';
import ConfirmModal from '../../components/common/ConfirmModal';
import SkeletonCard from '../../components/common/SkeletonCard';
import {
  Users, Search, Filter, Shield, UserCheck, Trash2,
  CheckCircle2, XCircle, Power, User
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [role]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (role) params.role = role;
      if (search) params.search = search;

      const res = await userService.getAllUsers(params);
      setUsers(res.data.users || []);
    } catch {
      toast.error('Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await userService.toggleUserStatus(userId);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive: res.data.user.isActive } : u))
      );
      toast.success(res.data.message);
    } catch {
      toast.error('Failed to change user status');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await userService.deleteUser(deleteId);
      setUsers((prev) => prev.filter((u) => u._id !== deleteId));
      toast.success('User account removed');
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Users className="w-6 h-6 text-primary-500" />
          User & Role Governance
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Monitor all student, educator, and administrator accounts, adjust credentials, and enforce access
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              placeholder="Search user by name or email address..."
              className="input pl-9 text-sm"
            />
          </div>

          <div className="flex gap-2">
            {['', 'student', 'teacher', 'admin'].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  role === r
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {r === '' ? 'All Roles' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="space-y-3">
          <SkeletonCard count={4} />
        </div>
      ) : users.length > 0 ? (
        <div className="card overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-400 font-bold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">College / Dept</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white leading-tight">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded capitalize ${
                        u.role === 'admin'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : u.role === 'teacher'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {u.college || '—'} {u.branch ? `(${u.branch})` : ''}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                        u.isActive ? 'text-emerald-600' : 'text-gray-400'
                      }`}>
                        {u.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-500" /> Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleStatus(u._id)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          u.isActive
                            ? 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                        }`}
                        title={u.isActive ? 'Deactivate User' : 'Activate User'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(u._id)}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-400 hover:text-rose-600"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center text-sm text-gray-500">
          No users matching criteria.
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete User Account?"
        message="Are you sure you want to permanently remove this user account? This cannot be undone."
        confirmLabel="Delete User"
        isDanger={true}
        isLoading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

