import React, { useEffect, useState } from 'react';
import { materialService } from '../../services';
import EmptyState from '../../components/common/EmptyState';
import SkeletonCard from '../../components/common/SkeletonCard';
import {
  FileText, Download, ExternalLink, Filter, Search,
  Eye, BookOpen, Layers, User, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const MATERIAL_TYPES = [
  { id: '', name: 'All Types' },
  { id: 'pdf', name: 'PDF Notes' },
  { id: 'question-paper', name: 'Previous Year Papers' },
  { id: 'lab-manual', name: 'Lab Manuals' },
  { id: 'practical', name: 'Practicals' },
];

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [semester, setSemester] = useState('');

  useEffect(() => {
    fetchMaterials();
  }, [type, semester]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const params = {};
      if (type) params.type = type;
      if (semester) params.semester = semester;
      if (search) params.search = search;

      const res = await materialService.getMaterials(params);
      setMaterials(res.data.materials || []);
    } catch (err) {
      toast.error('Failed to load study materials');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (material) => {
    try {
      await materialService.trackDownload(material._id);
      window.open(material.fileUrl, '_blank');
      toast.success('Opening material...');
    } catch (err) {
      window.open(material.fileUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Study Materials & Notes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Access previous year question papers, high-yield PDF notes, and lab manuals
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchMaterials()}
              placeholder="Search by topic, subject code, or title..."
              className="input pl-9 text-sm"
            />
          </div>

          <div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input text-sm"
            >
              {MATERIAL_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="input text-sm"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard count={6} />
        </div>
      ) : materials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((mat) => (
            <div key={mat._id} className="card p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 border border-primary-100 dark:border-primary-900/50">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {mat.type}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 dark:text-white text-base mt-4 line-clamp-1">
                  {mat.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {mat.description || 'Verified academic resource uploaded for curriculum support.'}
                </p>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5" />
                    <span>{mat.uploadedBy?.name || 'Faculty'}</span>
                  </div>
                  {mat.semester && (
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" /> Sem {mat.semester}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 flex gap-2">
                <button
                  onClick={() => handleDownload(mat)}
                  className="btn-primary flex-1 text-xs py-2 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  View & Download
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No study materials found"
          description="Try selecting a different semester or material category."
        />
      )}
    </div>
  );
}

