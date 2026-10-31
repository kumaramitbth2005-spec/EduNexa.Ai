import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { certificateService } from '../../services';
import {
  ShieldCheck, CheckCircle2, AlertTriangle, Search, Award,
  ArrowRight, ExternalLink, Calendar, GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerifyCertificate() {
  const { certificateId } = useParams();
  const [queryId, setQueryId] = useState(certificateId || '');
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (certificateId) {
      performVerification(certificateId);
    }
  }, [certificateId]);

  const performVerification = async (idToVerify) => {
    const trimmed = (idToVerify || '').trim().toUpperCase();
    if (!trimmed) return;

    try {
      setLoading(true);
      setError(null);
      setSearched(true);
      const res = await certificateService.verifyCertificate(trimmed);
      setCertData(res.data.certificate);
    } catch (err) {
      setCertData(null);
      setError(err.response?.data?.message || 'Certificate ID could not be verified in the EduNexa Academic Ledger.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performVerification(queryId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 flex flex-col justify-between">
      <div className="max-w-3xl mx-auto w-full space-y-8 animate-fade-in">
        {/* Platform Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-black text-primary-600">
            <span>EDUNEXA</span>
            <span className="text-xs uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-amber-500 text-white">
              VERIFY
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Academic Credential Verification Portal
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
            Public validation gateway for university faculty, employers, and accreditation boards to instantly authenticate EduNexa graduation certificates.
          </p>
        </div>

        {/* Verification Search Bar */}
        <div className="card p-4 shadow-xl border-primary-500/20">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={queryId}
                onChange={(e) => setQueryId(e.target.value)}
                placeholder="Enter Certificate ID (e.g. EDUNEXA-CERT-2026-X8Y9Z1)"
                className="input pl-9 text-xs sm:text-sm uppercase font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary py-2.5 px-6 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-primary-500/30"
            >
              {loading ? 'Verifying...' : 'Verify Certificate'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="card p-12 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-500">Querying cryptographic records...</p>
          </div>
        )}

        {/* ── Verified Certificate Card ── */}
        {!loading && certData && (
          <div className="card p-8 border-2 border-emerald-500/30 shadow-2xl space-y-6 bg-gradient-to-br from-emerald-50/20 via-white to-emerald-50/10 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 animate-fade-in">
            {/* Status Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated & Officially Verified
                  </span>
                  <div className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                    {certData.certificateId}
                  </div>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
                Grade: {certData.grade} ({certData.overallPercentage}%)
              </span>
            </div>

            {/* Credential Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-gray-400 uppercase tracking-wider text-[10px] font-bold">Graduating Student</span>
                <div className="text-base font-bold text-gray-900 dark:text-white">{certData.studentName}</div>
                <p className="text-gray-500">{certData.degree} in {certData.branch}</p>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 uppercase tracking-wider text-[10px] font-bold">Academic Institution</span>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{certData.college}</div>
                <p className="text-gray-400 text-[11px]">Accredited Campus Partner</p>
              </div>

              <div className="space-y-1 sm:col-span-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-gray-400 uppercase tracking-wider text-[10px] font-bold">Course Completed</span>
                <div className="text-base font-bold text-primary-600 dark:text-primary-400">{certData.courseTitle}</div>
                <p className="text-gray-500 capitalize">Discipline: {certData.courseCategory} • 22 Mandatory Tasks & 50-MCQ Final Assessment Passed</p>
              </div>
            </div>

            {/* Verification Sign-Off */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-gray-400 text-[10px] block">Issued Under Authority Of:</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{certData.issuedBy}</span>
                <span className="text-[11px] text-gray-500 block">{certData.authorityTitle}</span>
              </div>
              <div className="text-right text-[11px] text-gray-500">
                <span>Date Issued: <strong>{new Date(certData.completionDate).toLocaleDateString()}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* ── Error / Not Found ── */}
        {!loading && searched && error && (
          <div className="card p-8 text-center space-y-3 border-2 border-red-500/20 animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Certificate Record Not Found
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {error} Please verify the Certificate ID printed on the document and try again.
            </p>
          </div>
        )}
      </div>

      <div className="text-center py-6 text-xs text-gray-400">
        © 2026 EduNexa Academic Standards Board • Cryptographic Ledger Verification
      </div>
    </div>
  );
}
