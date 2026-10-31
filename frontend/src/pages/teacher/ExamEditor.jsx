import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { examService } from '../../services';
import {
  PenSquare, ArrowLeft, Plus, Trash2, Save, CheckCircle2,
  Clock, Award, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExamEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'mcq',
    duration: 30, // mins
    passingMarks: 5,
    isPublished: true,
  });

  const [questions, setQuestions] = useState([
    {
      text: '',
      type: 'mcq',
      marks: 1,
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
      explanation: '',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);

  useEffect(() => {
    if (isEditing) fetchExam();
  }, [id]);

  const fetchExam = async () => {
    try {
      setFetching(true);
      const res = await examService.getExam(id);
      const e = res.data.exam;
      setFormData({
        title: e.title || '',
        description: e.description || '',
        type: e.type || 'mcq',
        duration: e.duration || 30,
        passingMarks: e.passingMarks || 5,
        isPublished: e.isPublished ?? true,
      });
      if (e.questions?.length > 0) {
        setQuestions(e.questions);
      }
    } catch {
      toast.error('Failed to load exam details');
    } finally {
      setFetching(false);
    }
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        text: '',
        type: 'mcq',
        marks: 1,
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
        explanation: '',
      },
    ]);
  };

  const removeQuestion = (qIdx) => {
    if (questions.length === 1) {
      toast.error('An exam must have at least one question');
      return;
    }
    setQuestions((prev) => prev.filter((_, idx) => idx !== qIdx));
  };

  const updateQuestionText = (qIdx, text) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === qIdx ? { ...q, text } : q))
    );
  };

  const updateOptionText = (qIdx, optIdx, text) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIdx) return q;
        const newOpts = q.options.map((opt, oIdx) =>
          oIdx === optIdx ? { ...opt, text } : opt
        );
        return { ...q, options: newOpts };
      })
    );
  };

  const setCorrectOption = (qIdx, optIdx) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIdx) return q;
        const newOpts = q.options.map((opt, oIdx) => ({
          ...opt,
          isCorrect: oIdx === optIdx,
        }));
        return { ...q, options: newOpts };
      })
    );
  };

  const updateExplanation = (qIdx, explanation) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === qIdx ? { ...q, explanation } : q))
    );
  };

  const totalCalculatedMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter an exam title');
      return;
    }

    // Validation
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        toast.error(`Question ${i + 1} has empty text`);
        return;
      }
      if (questions[i].type === 'mcq') {
        const hasOptions = questions[i].options.every((o) => o.text.trim());
        if (!hasOptions) {
          toast.error(`Please fill in all 4 options for Question ${i + 1}`);
          return;
        }
      }
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        totalMarks: totalCalculatedMarks,
        questions,
      };

      if (isEditing) {
        await examService.updateExam(id, payload);
        toast.success('Exam updated successfully');
      } else {
        await examService.createExam(payload);
        toast.success('Exam created successfully');
      }
      navigate('/teacher/exams');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save exam');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="card p-12 text-center text-sm text-gray-500">Loading exam configuration...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-16">
      <Link to="/teacher/exams" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Exams
      </Link>

      <div>
        <h1 className="page-title flex items-center gap-2">
          <PenSquare className="w-6 h-6 text-primary-500" />
          {isEditing ? 'Edit Examination' : 'Author New Examination'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure questions, correct answers, time limit, and scoring criteria
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Exam Metadata Card */}
        <div className="card p-6 space-y-4">
          <h3 className="font-bold text-base text-gray-900 dark:text-white">Basic Information</h3>
          <div>
            <label className="label">Exam Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Operating Systems Mid-Term Assessment 2026"
              className="input text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Duration (Minutes)</label>
              <input
                type="number"
                min={5}
                max={180}
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="input text-sm"
              />
            </div>

            <div>
              <label className="label">Passing Marks</label>
              <input
                type="number"
                min={1}
                value={formData.passingMarks}
                onChange={(e) => setFormData({ ...formData, passingMarks: Number(e.target.value) })}
                className="input text-sm"
              />
            </div>

            <div>
              <label className="label">Total Marks (Calculated)</label>
              <input
                type="text"
                disabled
                value={`${totalCalculatedMarks} Points`}
                className="input text-sm bg-gray-100 dark:bg-gray-800 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Questions Builder Card */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Questions ({questions.length})
            </h3>
            <button
              type="button"
              onClick={addQuestion}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Question
            </button>
          </div>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="card p-6 space-y-4 relative border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-primary-600">
                  Question #{qIdx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeQuestion(qIdx)}
                  className="text-xs text-rose-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>

              <div>
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                  placeholder="Enter the question prompt here..."
                  className="input text-sm font-semibold"
                  required
                />
              </div>

              {/* MCQ Options with radio button selector for correct answer */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-gray-500">
                  Select radio button next to the CORRECT answer:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                      <input
                        type="radio"
                        name={`correct_opt_${qIdx}`}
                        checked={opt.isCorrect}
                        onChange={() => setCorrectOption(qIdx, optIdx)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        className="input text-xs !bg-transparent border-0 !p-1 focus:ring-0"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="label text-xs">Explanation (shown to student after exam submission)</label>
                <input
                  type="text"
                  value={q.explanation || ''}
                  onChange={(e) => updateExplanation(qIdx, e.target.value)}
                  placeholder="Explain why the selected option is correct..."
                  className="input text-xs"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Link to="/teacher/exams" className="btn-secondary text-sm px-4 py-2">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2 shadow-lg shadow-primary-500/25"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving Examination...' : isEditing ? 'Update Exam' : 'Publish Examination'}
          </button>
        </div>
      </form>
    </div>
  );
}

