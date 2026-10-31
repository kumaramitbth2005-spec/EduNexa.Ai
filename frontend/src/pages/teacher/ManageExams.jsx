import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { examService } from '../../services';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';
import {
  PenSquare, Plus, Edit, Trash2, Clock, Award
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await examService.getExams();
      setExams(res.data.exams || []);
    } catch {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await examService.deleteExam(deleteId);
      setExams((prev) => prev.filter((e) => e._id !== deleteId));
      toast.success('Exam deleted');
    } catch {
      toast.error('Failed to delete exam');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Examination Control</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Build MCQ assessments, manage timer durations, and configure automated grading
          </p>
        </div>

        <Link
          to="/teacher/exams/new"
          className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5 shadow-md shadow-primary-500/25 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Examination
        </Link>
      </div>

      {exams.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-400 font-bold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="p-4">Exam Title</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Total Marks</th>
                  <th className="p-4">Passing</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {exams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{exam.title}</p>
                    </td>
                    <td className="p-4 text-xs capitalize text-gray-500">{exam.type}</td>
                    <td className="p-4 text-xs font-mono">{exam.duration} mins</td>
                    <td className="p-4 text-xs font-bold">{exam.totalMarks} pts</td>
                    <td className="p-4 text-xs font-bold text-emerald-600">{exam.passingMarks} pts</td>
                    <td className="p-4 text-right space-x-2">
                      <Link
                        to={`/teacher/exams/${exam._id}/edit`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 inline-block"
                        title="Edit Exam"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteId(exam._id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600"
                        title="Delete Exam"
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
          icon={PenSquare}
          title="No examinations created yet"
          description="Create MCQ or practice tests with instant automated feedback."
          actionLabel="Create Exam"
          onAction={() => (window.location.href = '/teacher/exams/new')}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Examination?"
        message="Are you sure you want to delete this examination? Past student results will remain in history."
        confirmLabel="Delete Exam"
        isDanger={true}
        isLoading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

