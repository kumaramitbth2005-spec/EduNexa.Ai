import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services';
import {
  User, Mail, Building, BookOpen, Layers, Lock,
  Camera, Save, Shield, Globe, Moon, Sun, Check,
  Trash2, X, UploadCloud, AlertCircle, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser, darkMode, toggleDarkMode } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    college: user?.college || '',
    branch: user?.branch || '',
    semester: user?.semester || 1,
    degree: user?.degree || '',
    educationLevel: user?.educationLevel || 'undergraduate',
    learningGoals: user?.learningGoals || '',
    availableStudyHoursPerDay: user?.availableStudyHoursPerDay || 2,
    skills: user?.skills?.join(', ') || '',
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarError, setAvatarError] = useState('');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...profileData,
        skills: profileData.skills
          ? profileData.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      const res = await userService.updateProfile(payload);
      updateUser(res.data.user);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setSaving(true);
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarError('');

    // 1. File Type Validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      const msg = 'Invalid file format. Please choose a JPG, PNG, or WebP image.';
      setAvatarError(msg);
      toast.error(msg);
      return;
    }

    // 2. File Size Validation (5 MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const msg = 'File exceeds 5MB limit. Please upload an image smaller than 5MB.';
      setAvatarError(msg);
      toast.error(msg);
      return;
    }

    // 3. Set preview
    setSelectedAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const cancelAvatarPreview = () => {
    setSelectedAvatarFile(null);
    setAvatarPreview(null);
    setAvatarError('');
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatarFile) return;

    const formData = new FormData();
    formData.append('avatar', selectedAvatarFile);

    try {
      setAvatarUploading(true);
      setAvatarError('');
      const res = await userService.uploadAvatar(formData);
      updateUser(res.data.user);
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
      toast.success('Profile picture updated successfully!');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to upload profile picture.';
      setAvatarError(errMsg);
      toast.error(errMsg);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.avatar) return;
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

    try {
      setAvatarUploading(true);
      setAvatarError('');
      const res = await userService.deleteAvatar();
      updateUser(res.data.user);
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
      toast.success('Profile picture removed.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove avatar.');
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="page-title">Account Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your personal details, academic background, and security preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <User className="w-4 h-4" />
          General Profile
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          Security
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'preferences'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          Preferences
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="card p-6 space-y-6">
          {/* Avatar Header & Management */}
          <div className="pb-6 border-b border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-5">
                <div className="relative">
                  {/* Display preview if selecting, otherwise user.avatar, otherwise initials */}
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-amber-500 shadow-md ring-4 ring-amber-100 dark:ring-amber-950"
                    />
                  ) : user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary-500 shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <label
                    title="Change profile picture"
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary-600 text-white cursor-pointer hover:bg-primary-700 shadow-md transition-transform hover:scale-110"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleAvatarFileSelect}
                      className="hidden"
                      disabled={avatarUploading}
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {user?.name}
                    {avatarPreview && (
                      <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
                        Preview Mode
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role} Account • {user?.email}</p>
                  <p className="text-[11px] text-gray-400 mt-1">Supports JPG, PNG, WebP (Max 5MB)</p>
                </div>
              </div>

              {/* Action Buttons for Avatar */}
              <div className="flex items-center gap-2 flex-wrap">
                {avatarPreview ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelAvatarPreview}
                      disabled={avatarUploading}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 text-gray-600 dark:text-gray-300"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAvatar}
                      disabled={avatarUploading}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      {avatarUploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Save Picture
                        </>
                      )}
                    </button>
                  </>
                ) : user?.avatar ? (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={avatarUploading}
                    className="text-xs py-1.5 px-3 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Picture
                  </button>
                ) : null}
              </div>
            </div>

            {/* Error or Uploading Message */}
            {avatarError && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{avatarError}</span>
              </div>
            )}
            {avatarUploading && (
              <div className="p-2.5 rounded-lg bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-900/50 flex items-center gap-2 text-xs text-primary-600 dark:text-primary-300">
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                <span>Processing & securely saving profile picture...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Phone Number</label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Bio / Headline</label>
              <textarea
                rows={3}
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Aspiring software engineer passionate about algorithms and full-stack systems..."
                className="input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="label">College / Institute</label>
                <input
                  type="text"
                  value={profileData.college}
                  onChange={(e) => setProfileData({ ...profileData, college: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Degree</label>
                <input
                  type="text"
                  value={profileData.degree}
                  onChange={(e) => setProfileData({ ...profileData, degree: e.target.value })}
                  placeholder="e.g. B.Tech, BCA"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Branch / Major</label>
                <input
                  type="text"
                  value={profileData.branch}
                  onChange={(e) => setProfileData({ ...profileData, branch: e.target.value })}
                  placeholder="e.g. CSE, IT"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Current Semester</label>
                <select
                  value={profileData.semester}
                  onChange={(e) => setProfileData({ ...profileData, semester: Number(e.target.value) })}
                  className="input"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Education Level</label>
                <select
                  value={profileData.educationLevel}
                  onChange={(e) => setProfileData({ ...profileData, educationLevel: e.target.value })}
                  className="input"
                >
                  <option value="school">School / Higher Secondary</option>
                  <option value="undergraduate">Undergraduate (College / University)</option>
                  <option value="postgraduate">Postgraduate / Masters</option>
                  <option value="other">Other / Lifelong Learner</option>
                </select>
              </div>

              <div>
                <label className="label">Available Study Hours / Day</label>
                <input
                  type="number"
                  min="0.5"
                  max="14"
                  step="0.5"
                  value={profileData.availableStudyHoursPerDay}
                  onChange={(e) => setProfileData({ ...profileData, availableStudyHoursPerDay: Number(e.target.value) })}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Learning & Career Goals</label>
              <textarea
                rows={2}
                value={profileData.learningGoals}
                onChange={(e) => setProfileData({ ...profileData, learningGoals: e.target.value })}
                placeholder="e.g. Prepare for GATE, Master Full Stack Development, Crack FAANG Interviews"
                className="input"
              />
            </div>

            <div>
              <label className="label">Skills (comma-separated)</label>
              <input
                type="text"
                value={profileData.skills}
                onChange={(e) => setProfileData({ ...profileData, skills: e.target.value })}
                placeholder="Python, React, Data Structures, Machine Learning"
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 text-sm px-6 py-2.5 mt-4"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Security */}
      {activeTab === 'security' && (
        <div className="card p-6 space-y-6">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">Change Password</h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="label">Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Min 8 characters"
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Preferences */}
      {activeTab === 'preferences' && (
        <div className="card p-6 space-y-6">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">App Preferences</h3>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Dark Mode</h4>
              <p className="text-xs text-gray-500">Toggle dark / light theme for comfortable late-night study</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Preferred AI Language</h4>
              <p className="text-xs text-gray-500">Default language for AI explanations</p>
            </div>
            <span className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-950 px-3 py-1 rounded-full border border-primary-200">
              English & Hindi Supported
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

