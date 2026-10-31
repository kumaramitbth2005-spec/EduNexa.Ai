import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { courseService } from '../../services';
import SkeletonCard from '../../components/common/SkeletonCard';
import EmptyState from '../../components/common/EmptyState';
import { Search, Filter, BookOpen, Star, User, Layers, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: '', name: 'All Categories' },
  { id: 'programming', name: 'Programming' },
  { id: 'web-dev', name: 'Web Development' },
  { id: 'dsa', name: 'Data Structures & Algorithms' },
  { id: 'ai-ml', name: 'AI & Machine Learning' },
  { id: 'database', name: 'Databases' },
  { id: 'cloud', name: 'Cloud Computing' },
];

export default function Courses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const level = searchParams.get('level') || '';
  const semester = searchParams.get('semester') || '';

  useEffect(() => {
    fetchCourses();
  }, [search, category, level, semester]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (level) params.level = level;
      if (semester) params.semester = semester;

      const res = await courseService.getCourses(params);
      setCourses(res.data.courses || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Explore Courses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Master university curriculum and technical skills from verified educators
          </p>
        </div>
        <div className="text-sm font-semibold text-gray-500">
          Showing <span className="text-primary-600 font-bold">{courses.length}</span> of {total} courses
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by title, topic, or keyword..."
              className="input pl-9 text-sm"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input text-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="input text-sm"
            >
              <option value="">All Difficulty Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard type="course" count={6} />
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course._id} className="card overflow-hidden flex flex-col justify-between group hover:-translate-y-1 transition-all">
              <div>
                {/* Course Thumbnail */}
                <div className="h-44 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-primary-600">
                      <BookOpen className="w-12 h-12 opacity-60" />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-gray-900/90 text-primary-600 backdrop-blur-sm shadow-sm capitalize">
                    {course.category}
                  </span>
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-sm capitalize">
                    {course.level}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 mb-1.5 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{course.rating ? course.rating.toFixed(1) : '4.8'}</span>
                    <span className="text-gray-400 font-normal">({course.enrollmentCount || 0} students)</span>
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate max-w-[120px] font-medium">{course.teacher?.name || 'Verified Faculty'}</span>
                    </div>
                    {course.semester && (
                      <span className="inline-flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-gray-400" />
                        Sem {course.semester}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <Link
                  to={`/courses/${course._id}`}
                  className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-2"
                >
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No courses matched your search"
          description="Try broadening your category or search keywords to explore our educational catalog."
          actionLabel="Clear Filters"
          onAction={() => setSearchParams({})}
        />
      )}
    </div>
  );
}

