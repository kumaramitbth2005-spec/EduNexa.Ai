import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { courseService } from '../../services';
import ProgressBar from '../../components/ui/ProgressBar';
import {
  Award, CheckCircle2, XCircle, AlertTriangle, Printer,
  Share2, ArrowLeft, Download, ExternalLink, ShieldCheck, Sparkles, Copy, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CertificatePage() {
  const { id } = useParams();
  const [eligibilityData, setEligibilityData] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchEligibility();
  }, [id]);

  const fetchEligibility = async () => {
    try {
      setLoading(true);
      const res = await courseService.checkCertificateEligibility(id);
      setEligibilityData(res.data);

      if (res.data.certificateAlreadyIssued && res.data.certificateId) {
        // Fetch existing certificate
        const certRes = await courseService.generateCertificate(id);
        if (certRes.data.certificate) {
          setCertificate(certRes.data.certificate);
        }
      }
    } catch (err) {
      toast.error('Failed to load certificate eligibility.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      setGenerating(true);
      toast('Verifying academic eligibility and issuing certificate...', { icon: '🎓' });
      const res = await courseService.generateCertificate(id);
      if (res.data.success) {
        toast.success(res.data.message || 'Certificate successfully generated!');
        setCertificate(res.data.certificate);
        fetchEligibility();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate certificate.');
    } finally {
      setGenerating(false);
    }
  };

  const copyVerificationLink = () => {
    if (!certificate) return;
    const url = `${window.location.origin}/verify-certificate/${certificate.certificateId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Public verification link copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6">
        <div className="skeleton h-12 w-64 rounded-xl" />
        <div className="skeleton h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const crit = eligibilityData?.criteria || {};
  const isEligible = eligibilityData?.isEligible;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6 animate-fade-in pb-16">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to={`/courses/${id}`}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Course Overview
        </Link>
        <Link to="/my-learning" className="text-xs text-primary-600 font-semibold hover:underline">
          My Learning Dashboard
        </Link>
      </div>

      {/* ── CASE 1: Certificate Issued — Official Certificate Render ── */}
      {certificate ? (
        <div className="space-y-6">
          {/* Actions Bar */}
          <div className="card p-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-purple-500/10 border-amber-500/30">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Verified Academic Certificate
                </h2>
                <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold">
                  ID: {certificate.certificateId}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyVerificationLink}
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Link Copied' : 'Share Verification Link'}
              </button>
              <button
                onClick={() => window.print()}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-md shadow-primary-500/30"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Download PDF
              </button>
            </div>
          </div>

          {/* Printable Official Certificate Canvas */}
          <div
            id="edunexa-certificate"
            className="card p-10 sm:p-14 border-8 border-double border-amber-600/40 relative overflow-hidden bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 shadow-2xl text-center space-y-6"
          >
            {/* Corner Decorative Borders */}
            <div className="absolute top-3 left-3 w-12 h-12 border-t-2 border-l-2 border-amber-600" />
            <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-amber-600" />
            <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-amber-600" />
            <div className="absolute bottom-3 right-3 w-12 h-12 border-b-2 border-r-2 border-amber-600" />

            {/* Platform Branding */}
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-black tracking-tight text-primary-600">EDUNEXA</span>
                <span className="text-xs uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-amber-500 text-white">
                  ACADEMIC
                </span>
              </div>
              <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold">
                Council for High-Performance Academic Standards & Technical Education
              </p>
            </div>

            <div className="pt-2">
              <span className="text-xs uppercase tracking-widest font-bold text-amber-600 dark:text-amber-400">
                Official Certificate of Course Completion
              </span>
              <p className="text-xs text-gray-400 mt-1">This document certifies that</p>
            </div>

            {/* Student Name */}
            <div className="py-2">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white tracking-wide border-b-2 border-amber-500/30 pb-3 max-w-lg mx-auto">
                {certificate.studentName}
              </h1>
              <p className="text-xs text-gray-500 mt-2 font-medium">
                {certificate.degree} in {certificate.branch} • {certificate.college}
              </p>
            </div>

            {/* Achievement text */}
            <div className="max-w-xl mx-auto space-y-2">
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                has successfully fulfilled all rigorous academic curriculum milestones, completed all <strong>22 mandatory practical assignments</strong>, and demonstrated distinguished mastery by passing the comprehensive 50-question final assessment with a grade of <strong>{certificate.grade}</strong> ({certificate.overallPercentage}%) in
              </p>
              <h3 className="text-xl font-bold text-primary-600 dark:text-primary-400 pt-1">
                {certificate.courseTitle}
              </h3>
            </div>

            {/* AI Citation */}
            {certificate.aiAchievementMessage && (
              <div className="max-w-md mx-auto p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 italic">
                "{certificate.aiAchievementMessage}"
              </div>
            )}

            {/* Footer with Signatures & QR */}
            <div className="grid grid-cols-3 items-end pt-8 border-t border-gray-200 dark:border-gray-800 text-left">
              <div>
                <div className="font-serif italic text-base text-gray-800 dark:text-gray-200 font-bold">
                  Dr. Rajesh Sharma
                </div>
                <div className="text-[10px] text-gray-400 font-semibold">
                  Chairperson, Academic Standards Board
                </div>
                <div className="text-[10px] text-gray-400">Indian Institute of Technology Partner</div>
              </div>

              {/* Official Seal */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-600 text-amber-600 flex flex-col items-center justify-center mx-auto text-[9px] font-bold uppercase shadow-inner">
                  <span>EduNexa</span>
                  <span className="text-[7px]">VERIFIED</span>
                </div>
              </div>

              <div className="text-right space-y-0.5">
                <div className="text-[11px] font-bold text-gray-800 dark:text-gray-200">
                  Issued: {new Date(certificate.completionDate).toLocaleDateString()}
                </div>
                <div className="text-[10px] text-gray-400 font-mono">
                  ID: {certificate.certificateId}
                </div>
                <Link
                  to={`/verify-certificate/${certificate.certificateId}`}
                  target="_blank"
                  className="text-[10px] text-primary-600 hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  Verify Authenticity <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── CASE 2: Eligibility Checklist Screen ── */
        <div className="space-y-6">
          <div className="card p-6 space-y-3 bg-gradient-to-r from-primary-900/10 to-purple-900/10 border-primary-200 dark:border-primary-900/30">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-100 dark:bg-primary-950 text-primary-600">
              Verified Certification Engine
            </span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Course Completion & Certificate Eligibility
            </h1>
            <p className="text-xs text-gray-500 max-w-xl">
              EduNexa certificates are verified academic credentials. To earn your certificate for <span className="font-semibold text-gray-800 dark:text-gray-200">{eligibilityData?.course?.title}</span>, the 5 criteria below must be completely fulfilled.
            </p>
          </div>

          {/* 5-Point Eligibility Checklist */}
          <div className="card p-6 space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
              Mandatory Graduation Checklist
            </h3>

            <div className="space-y-3">
              {/* Requirement 1: Lessons Progress */}
              <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${crit.lessonsCompleted?.passed ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center gap-3">
                  {crit.lessonsCompleted?.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      1. Complete All Course Modules & Topics
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Completed {crit.lessonsCompleted?.completed || 0} of {crit.lessonsCompleted?.required || 0} curriculum topics ({crit.lessonsCompleted?.percentage || 0}%)
                    </p>
                  </div>
                </div>

                {!crit.lessonsCompleted?.passed && (
                  <Link to={`/courses/${id}/learn`} className="btn-secondary text-[11px] py-1.5 px-3">
                    Continue Topics
                  </Link>
                )}
              </div>

              {/* Requirement 2: 22 Assignments */}
              <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${crit.assignmentsCompleted?.passed ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center gap-3">
                  {crit.assignmentsCompleted?.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      2. Submit All 22 Progressive Assignments
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Submitted and evaluated {crit.assignmentsCompleted?.completed || 0} of 22 assignments
                    </p>
                  </div>
                </div>

                {!crit.assignmentsCompleted?.passed && (
                  <Link to={`/courses/${id}/assignments`} className="btn-secondary text-[11px] py-1.5 px-3">
                    Solve Assignments
                  </Link>
                )}
              </div>

              {/* Requirement 3: Assignment Passing Average */}
              <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${crit.assignmentsPassingMarks?.passed ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center gap-3">
                  {crit.assignmentsPassingMarks?.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      3. Assignment Passing Standard (Minimum 60% Average)
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Current Assignment Score Average: {crit.assignmentsPassingMarks?.averageScore || 0}% (Required: 60%)
                    </p>
                  </div>
                </div>
              </div>

              {/* Requirement 4: 50-MCQ Assessment */}
              <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${crit.assessmentCompleted?.passed ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center gap-3">
                  {crit.assessmentCompleted?.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      4. Mandatory 50-Question MCQ Final Assessment (Score $\ge$ 70%)
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Current Assessment Score: {crit.assessmentCompleted?.percentage || 0}% ({crit.assessmentCompleted?.score || 0}/50) • Required: 70% (35 Marks)
                    </p>
                  </div>
                </div>

                {!crit.assessmentCompleted?.passed && (
                  <Link to={`/courses/${id}/assessment`} className="btn-secondary text-[11px] py-1.5 px-3">
                    Take Assessment
                  </Link>
                )}
              </div>

              {/* Requirement 5: Final Practical Project */}
              <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${crit.finalProjectCompleted ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center gap-3">
                  {crit.finalProjectCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      5. Final Practical Capstone Project (Assignment #22)
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      End-to-end practical system implementation
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Claim Certificate Action Button */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              {isEligible ? (
                <button
                  onClick={handleGenerateCertificate}
                  disabled={generating}
                  className="btn-primary w-full py-3.5 text-base rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary-500/30"
                >
                  <Award className="w-5 h-5" />
                  {generating ? 'Generating Authenticated Certificate...' : 'Claim & Verify Your Certificate Now'}
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/70 text-center space-y-1">
                  <span className="font-bold text-xs text-gray-600 dark:text-gray-300">
                    Certificate Locked
                  </span>
                  <p className="text-[11px] text-gray-400">
                    Complete all 5 academic requirements above to automatically unlock your verified certificate.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
