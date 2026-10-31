import React, { useState } from 'react';
import { aiService } from '../../services';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  UploadCloud, FileText, Zap, Copy, Download,
  Check, AlertCircle, RefreshCw, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PDFSummarizer() {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [copied, setCopied] = useState(false);

  const handleFileUpload = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (selected.type !== 'application/pdf' && !selected.name.endsWith('.txt')) {
      toast.error('Please upload a PDF or text document');
      return;
    }

    setFile(selected);

    // Read text directly if text file or read slice
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setExtractedText(content);
      toast.success(`Loaded document "${selected.name}"`);
    };
    reader.readAsText(selected);
  };

  const handleSummarize = async () => {
    if (!extractedText.trim()) {
      toast.error('Document content could not be read or is empty');
      return;
    }

    try {
      setLoading(true);
      const res = await aiService.summarize({
        text: extractedText,
        fileName: file?.name || 'Uploaded Document',
        language,
      });

      setSummary(res.data.summary);
      toast.success('Document summarized successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to summarize document');
    } finally {
      setLoading(false);
    }
  };

  const copySummary = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success('Summary copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSummaryTxt = () => {
    const element = document.createElement('a');
    const fileBlob = new Blob([summary], { type: 'text/plain' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = `${file?.name || 'document'}_summary.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-500" />
          AI Document & PDF Summarizer
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Transform comprehensive research papers, chapter PDFs, and lecture notes into executive revision summaries
        </p>
      </div>

      {/* Upload Zone */}
      <div className="card p-6 border-dashed border-2 text-center">
        <label className="cursor-pointer flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-600 shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <span className="font-bold text-gray-900 dark:text-white text-base">
              {file ? file.name : 'Click to select or drag and drop a PDF / Text file'}
            </span>
            <p className="text-xs text-gray-400 mt-0.5">Supports PDF notes, syllabus files, and research summaries</p>
          </div>
          <input
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Or Paste Text Option */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Document Content (or paste lecture notes directly)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-xs border rounded p-1 dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </div>
        </div>

        <textarea
          rows={5}
          value={extractedText}
          onChange={(e) => setExtractedText(e.target.value)}
          placeholder="Paste syllabus text, article excerpts, or book sections here if not uploading a file..."
          className="input text-xs font-mono"
        />

        <div className="flex justify-end">
          <button
            onClick={handleSummarize}
            disabled={!extractedText.trim() || loading}
            className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2 shadow-md shadow-primary-500/20"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing Document with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate High-Yield Summary
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Output */}
      {summary && (
        <div className="card p-6 space-y-4 border border-primary-200 dark:border-primary-900 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Generated Revision Summary
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={copySummary}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                Copy
              </button>
              <button
                onClick={downloadSummaryTxt}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Export TXT
              </button>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed p-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {summary}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

