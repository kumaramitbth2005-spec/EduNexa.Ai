import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseService } from '../../services';
import {
  BookOpen, ArrowLeft, Save, Upload, CheckCircle2, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'programming',
    level: 'beginner',
    semester: 1,
    duration: '10 hours',
    isPublished: true,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      fetchCourse();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      setFetching(true);
      const res = await courseService.getCourse(id);
      const c = res.data.course;
      setFormData({
        title: c.title || '',
        description: c.description || '',
        category: c.category || 'programming',
        level: c.level || 'beginner',
        semester: c.semester || 1,
        duration: c.duration || '10 hours',
        isPublished: c.isPublished ?? true,
      });
    } catch {
      toast.error('Failed to load course details');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in title and description');
      return;
    }

    try {
      setLoading(true);
      if (isEditing) {
        await courseService.updateCourse(id, formData);
        toast.success('Course updated successfully');
      } else {
        await courseService.createCourse(formData);
        toast.success('Course created successfully');
      }
      navigate('/teacher/courses');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="card p-12 text-center text-sm text-gray-500">Loading course...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-12">
      <Link to="/teacher/courses" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Courses
      </Link>

      <div>
        <h1 className="page-title flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary-500" />
          {isEditing ? 'Edit Course Curriculum' : 'Create New Course'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure title, difficulty level, university semester track, and learning objectives
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-5">
        <div>
          <label className="label">Course Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Advanced Operating Systems & Distributed Systems"
            className="input text-sm"
            required
          />
        </div>

        <div>
          <label className="label">Description / Syllabus Overview</label>
          <textarea
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Provide a comprehensive summary of topics covered in this curriculum track..."
            className="input text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input text-sm"
            >
              <option value="programming">Programming</option>
              <option value="web-dev">Web Development</option>
              <option value="dsa">Data Structures & Algo</option>
              <option value="ai-ml">AI & Machine Learning</option>
              <option value="database">Databases</option>
              <option value="cloud">Cloud Computing</option>
              <option value="cybersecurity">Cybersecurity</option>
            </select>
          </div>

          <div>
            <label className="label">Difficulty Level</label>
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              className="input text-sm"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="label">Curriculum Semester</label>
            <select
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
              className="input text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Estimated Duration</label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="e.g. 12 hours"
              className="input text-sm"
            />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="isPublished"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
            />
            <label htmlFor="isPublished" className="text-sm font-semibold text-gray-800 dark:text-gray-200 cursor-pointer">
              Publish immediately (visible to students)
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Link to="/teacher/courses" className="btn-secondary text-sm px-4 py-2">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary text-sm px-6 py-2 flex items-center gap-2 shadow-md shadow-primary-500/25"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving Course...' : isEditing ? 'Update Course' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
}

