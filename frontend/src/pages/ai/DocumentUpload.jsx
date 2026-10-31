import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, Image, Loader2, AlertTriangle, CheckCircle,
  ChevronRight, Brain, BookOpen, X, Eye, Trash2, Plus, Lightbulb
} from 'lucide-react';
import { documentService, syllabusService } from '../../services';

const STATUS_COLORS = {
  done: 'text-green-600 bg-green-50 dark:bg-green-900/30',
  processing: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
  pending: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30',
  failed: 'text-red-600 bg-red-50 dark:bg-red-900/30',
};

const CONFIDENCE_LABELS = {
  high: { label: 'High confidence', color: 'text-green-600' },
  medium: { label: 'Medium confidence', color: 'text-yellow-600' },
  low: { label: 'Low confidence', color: 'text-orange-600' },
  failed: { label: 'OCR failed', color: 'text-red-600' },
  not_applicable: { label: 'Text extracted', color: 'text-blue-600' },
};

export default function DocumentUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [syllabi, setSyllabi] = useState([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState('');
  const [syllabusLoaded, setSyllabusLoaded] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [showOCRText, setShowOCRText] = useState(false);
  const [degree, setDegree] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');

  const loadSyllabi = useCallback(async () => {
    if (syllabusLoaded) return;
    try {
      const params = {};
      if (degree) params.degree = degree;
      if (branch) params.branch = branch;
      if (semester) params.semester = semester;
      const res = await syllabusService.getSyllabi(params);
      setSyllabi(res.data.syllabi || []);
    } catch (e) {
      setSyllabi([]);
    }
    setSyllabusLoaded(true);
  }, [syllabusLoaded, degree, branch, semester]);

  const processFile = async (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setError('Invalid file type. Please upload JPG, PNG, or PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10 MB.');
      return;
    }

    setError('');
    setUploading(true);
    setUploadedDoc(null);
    setReport(null);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('title', title || file.name);
      formData.append('subjectName', subjectName);

      const res = await documentService.uploadDocument(formData);
      const doc = res.data.document;
      setUploadedDoc(doc);

      // Fetch full doc to get OCR text
      const full = await documentService.getDocument(doc._id);
      setUploadedDoc(full.data.document);
      setPreviewText(full.data.document.ocrText?.slice(0, 600) || '');

      // Load syllabi
      setSyllabusLoaded(false);
      await loadSyllabi();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  }, [title, subjectName]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
    e.target.value = '';
  };

  const runAnalysis = async () => {
    if (!uploadedDoc) return;
    setAnalyzing(true);
    setError('');
    try {
      const res = await documentService.analyzeDocument(uploadedDoc._id, {
        syllabusId: selectedSyllabus || undefined,
      });
      setReport(res.data.report);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const coverageColor = (status) => {
    if (status === 'covered') return 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-700';
    if (status === 'partial') return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700';
    return 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-700';
  };

  const coverageBadge = (status) => {
    if (status === 'covered') return 'bg-green-500 text-white';
    if (status === 'partial') return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Brain className="text-purple-600" size={28} />
          Handwritten Notes Intelligence
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Upload your handwritten notes. AI will extract text, identify topics, and compare with your syllabus.
        </p>
      </div>

      {/* Upload Form */}
      {!uploadedDoc && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Chapter 5 - Linked Lists"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject (optional)</label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g., Data Structures"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
              ${dragOver
                ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10'
              }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-purple-600" size={40} />
                <p className="text-purple-600 font-medium">Processing document & running OCR...</p>
                <p className="text-sm text-gray-500">This may take 15–30 seconds</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-3">
                  <Image className="text-purple-400" size={36} />
                  <FileText className="text-blue-400" size={36} />
                </div>
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-200">Drag & drop or click to upload</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">JPG, PNG, PDF — max 10 MB</p>
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleFileChange} />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3 text-sm">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
        </div>
      )}

      {/* Uploaded Document Card */}
      {uploadedDoc && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          {/* Doc Info */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {uploadedDoc.mimeType?.includes('image') ? (
                <Image className="text-purple-500" size={28} />
              ) : (
                <FileText className="text-blue-500" size={28} />
              )}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{uploadedDoc.title}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[uploadedDoc.processingStatus]}`}>
                    {uploadedDoc.processingStatus === 'done' ? '✓ OCR Complete' : uploadedDoc.processingStatus}
                  </span>
                  {uploadedDoc.ocrConfidence && CONFIDENCE_LABELS[uploadedDoc.ocrConfidence] && (
                    <span className={`text-xs font-medium ${CONFIDENCE_LABELS[uploadedDoc.ocrConfidence].color}`}>
                      {CONFIDENCE_LABELS[uploadedDoc.ocrConfidence].label}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => { setUploadedDoc(null); setReport(null); setError(''); }}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* OCR Notes Warning */}
          {uploadedDoc.ocrNotes && uploadedDoc.ocrNotes !== 'None' && (
            <div className="flex gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-300">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">OCR Note: </span>{uploadedDoc.ocrNotes}
              </div>
            </div>
          )}

          {/* Detected info */}
          {(uploadedDoc.detectedSubject || uploadedDoc.detectedTopics?.length > 0) && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 space-y-2">
              {uploadedDoc.detectedSubject && (
                <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
                  📚 Detected subject: <span className="font-bold">{uploadedDoc.detectedSubject}</span>
                </p>
              )}
              {uploadedDoc.detectedTopics?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {uploadedDoc.detectedTopics.map((t) => (
                    <span key={t} className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* OCR Text Preview */}
          {previewText && (
            <div>
              <button
                onClick={() => setShowOCRText(!showOCRText)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Eye size={14} />
                {showOCRText ? 'Hide' : 'Show'} extracted text preview
              </button>
              {showOCRText && (
                <div className="mt-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 font-mono max-h-48 overflow-y-auto whitespace-pre-wrap border border-gray-200 dark:border-gray-700">
                  {previewText}
                  {uploadedDoc.ocrText?.length > 600 && (
                    <span className="text-gray-400"> ...[{uploadedDoc.ocrText.length - 600} more characters]</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Syllabus Selector */}
          {!report && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">Run AI Analysis</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Optionally select a syllabus to compare your notes against official topics.
                Without a syllabus, AI will still analyze what is present in your notes.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  placeholder="Degree (e.g. B.Tech)"
                  value={degree}
                  onChange={(e) => { setDegree(e.target.value); setSyllabusLoaded(false); }}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <input
                  placeholder="Branch (e.g. CSE)"
                  value={branch}
                  onChange={(e) => { setBranch(e.target.value); setSyllabusLoaded(false); }}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <input
                  placeholder="Semester (1-8)"
                  value={semester}
                  onChange={(e) => { setSemester(e.target.value); setSyllabusLoaded(false); }}
                  type="number" min="1" max="8"
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setSyllabusLoaded(false); loadSyllabi(); }}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Search Syllabi
                </button>
                {syllabi.length > 0 && (
                  <select
                    value={selectedSyllabus}
                    onChange={(e) => setSelectedSyllabus(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="">-- No syllabus (analyze notes only) --</option>
                    {syllabi.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.subject} — {s.degree} {s.branch} Sem {s.semester}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3 text-sm">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              <button
                onClick={runAnalysis}
                disabled={analyzing || uploadedDoc.processingStatus !== 'done'}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                {analyzing ? (
                  <><Loader2 className="animate-spin" size={18} /> Analyzing notes...</>
                ) : (
                  <><Brain size={18} /> Run AI Analysis</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Analysis Report */}
      {report && report.reportStatus === 'complete' && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <CheckCircle className="text-green-500" size={22} />
              Analysis Report
            </h2>

            {report.ocrQualityNote && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-4 text-sm text-yellow-800 dark:text-yellow-300">
                <span className="font-medium">⚠ OCR Reliability Note: </span>{report.ocrQualityNote}
              </div>
            )}

            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{report.executiveSummary}</p>

            {/* Coverage Stats */}
            {report.hasSyllabus && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {[
                  { label: 'Covered', value: report.coveredCount, color: 'text-green-600' },
                  { label: 'Partial', value: report.partialCount, color: 'text-yellow-600' },
                  { label: 'Missing', value: report.missingCount, color: 'text-red-600' },
                ].map((s) => (
                  <div key={s.label} className="text-center bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {report.hasSyllabus && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Coverage</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{report.coveragePercent}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${report.coveragePercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Topic Coverage */}
          {report.topicCoverage?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen size={18} className="text-blue-500" /> Topic Coverage
              </h3>
              <div className="space-y-2">
                {report.topicCoverage.map((t, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${coverageColor(t.status)}`}
                  >
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 mt-0.5 ${coverageBadge(t.status)}`}>
                      {t.status}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{t.topicName}</p>
                      {t.unit && <p className="text-gray-500 dark:text-gray-400 text-xs">{t.unit}</p>}
                      {t.note && <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 italic">{t.note}</p>}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{t.confidence} conf.</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Possible Issues */}
          {report.possibleErrors?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-orange-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <AlertTriangle size={18} className="text-orange-500" /> Possible Issues (Require Verification)
              </h3>
              <p className="text-xs text-orange-600 dark:text-orange-400 mb-4 bg-orange-50 dark:bg-orange-900/20 rounded px-3 py-2">
                ⚠ These are AI-detected observations, not confirmed errors. Please verify each with your teacher or reference material before acting on them.
              </p>
              <div className="space-y-3">
                {report.possibleErrors.map((e, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800 text-sm">
                    <AlertTriangle size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-gray-800 dark:text-gray-200">{e.description}</p>
                      {e.pageOrSection && <p className="text-xs text-gray-500 mt-1">Location: {e.pageOrSection}</p>}
                      <span className={`text-xs font-medium mt-1 inline-block ${e.severity === 'high' ? 'text-red-600' : e.severity === 'medium' ? 'text-orange-600' : 'text-yellow-600'}`}>
                        {e.severity} severity · AI confidence: {e.aiConfidence}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {(report.recommendations?.length > 0 || report.revisionTopics?.length > 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Lightbulb size={18} className="text-yellow-500" /> Recommendations
              </h3>
              {report.recommendations?.length > 0 && (
                <ul className="space-y-2 mb-4">
                  {report.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <ChevronRight size={16} className="text-purple-500 flex-shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              )}
              {report.revisionTopics?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Topics to revise:</p>
                  <div className="flex flex-wrap gap-2">
                    {report.revisionTopics.map((t) => (
                      <span key={t} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload another */}
          <button
            onClick={() => { setUploadedDoc(null); setReport(null); setError(''); setTitle(''); setSubjectName(''); }}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            <Plus size={18} />
            Upload Another Document
          </button>
        </div>
      )}
    </div>
  );
}

