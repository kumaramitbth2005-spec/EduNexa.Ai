import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { courseService } from '../../services';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';
import {
  BookOpen, Plus, Edit, Trash2, Eye, Users, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await courseService.getTeacherCourses();
      setCourses(res.data.courses || []);
    } catch {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await courseService.deleteCourse(deleteId);
      setCourses((prev) => prev.filter((c) => c._id !== deleteId));
      toast.success('Course deleted successfully');
    } catch (err) {
      toast.error('Failed to delete course');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Curriculum Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Author, edit, publish, and structure your semester courses and subjects
          </p>
        </div>

        <Link
          to="/teacher/courses/new"
          className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5 shadow-md shadow-primary-500/25 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Course
        </Link>
      </div>

      {courses.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-400 font-bold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="p-4">Course Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Level</th>
                  <th className="p-4">Enrollments</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {courses.map((course) => (
                  <tr key={course._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-900 dark:text-white line-clamp-1">
                        {course.title}
                      </p>
                    </td>
                    <td className="p-4 text-xs capitalize text-gray-500">
                      {course.category}
                    </td>
                    <td className="p-4 text-xs capitalize text-gray-500">
                      {course.level}
                    </td>
                    <td className="p-4 text-xs font-semibold">
                      {course.enrollmentCount || 0} students
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        course.isPublished
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link
                        to={`/courses/${course._id}`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 inline-block"
                        title="Preview Course"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/teacher/courses/${course._id}/edit`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 inline-block"
                        title="Edit Course"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteId(course._id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600"
                        title="Delete Course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No courses created yet"
          description="Click below to configure your syllabus and upload video or text lessons."
          actionLabel="Create Course"
          onAction={() => (window.location.href = '/teacher/courses/new')}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Course?"
        message="Are you sure you want to permanently delete this course? All associated lesson records will also be removed."
        confirmLabel="Delete Course"
        isDanger={true}
        isLoading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

