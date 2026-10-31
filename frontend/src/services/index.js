import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
};

export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (formData) => api.put('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => api.put('/users/change-password', data),
  getDashboardStats: () => api.get('/users/dashboard-stats'),
  getAllUsers: (params) => api.get('/users', { params }),
  toggleUserStatus: (id) => api.put(`/users/${id}/status`),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getAdminStats: () => api.get('/users/admin/stats'),
};

export const courseService = {
  getCourses: (params) => api.get('/courses', { params }),
  getCourse: (id) => api.get(`/courses/${id}`),
  createCourse: (data) => api.post('/courses', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCourse: (id, data) => api.put(`/courses/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  enrollCourse: (id) => api.post(`/courses/${id}/enroll`),
  getCourseProgress: (id) => api.get(`/courses/${id}/progress`),
  completeLesson: (courseId, lessonId) => api.post(`/courses/${courseId}/lessons/${lessonId}/complete`),
  getTeacherCourses: () => api.get('/courses/teacher/my-courses'),
  getEnrolledCourses: () => api.get('/courses/student/enrolled'),
};

export const examService = {
  getExams: (params) => api.get('/exams', { params }),
  getExam: (id) => api.get(`/exams/${id}`),
  createExam: (data) => api.post('/exams', data),
  updateExam: (id, data) => api.put(`/exams/${id}`, data),
  deleteExam: (id) => api.delete(`/exams/${id}`),
  submitExam: (id, data) => api.post(`/exams/${id}/submit`, data),
  getExamResults: (id) => api.get(`/exams/${id}/results`),
  getStudentHistory: () => api.get('/exams/student/history'),
};

export const aiService = {
  chat: (data) => api.post('/ai/chat', data),
  summarize: (data) => api.post('/ai/summarize', data),
  generateQuestions: (data) => api.post('/ai/generate-questions', data),
  generateStudyPlan: (data) => api.post('/ai/study-plan', data),
  translate: (data) => api.post('/ai/translate', data),
  getConversations: (params) => api.get('/ai/conversations', { params }),
  getConversation: (id) => api.get(`/ai/conversations/${id}`),
  deleteConversation: (id) => api.delete(`/ai/conversations/${id}`),
};

export const materialService = {
  getMaterials: (params) => api.get('/materials', { params }),
  getMaterial: (id) => api.get(`/materials/${id}`),
  uploadMaterial: (formData) => api.post('/materials', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateMaterial: (id, data) => api.put(`/materials/${id}`, data),
  deleteMaterial: (id) => api.delete(`/materials/${id}`),
  trackDownload: (id) => api.post(`/materials/${id}/download`),
};

export const communityService = {
  getPosts: (params) => api.get('/community/posts', { params }),
  getPost: (id) => api.get(`/community/posts/${id}`),
  createPost: (data) => api.post('/community/posts', data),
  updatePost: (id, data) => api.put(`/community/posts/${id}`, data),
  deletePost: (id) => api.delete(`/community/posts/${id}`),
  votePost: (id, voteType) => api.post(`/community/posts/${id}/vote`, { voteType }),
  addComment: (id, data) => api.post(`/community/posts/${id}/comments`, data),
  reportPost: (id, reason) => api.post(`/community/posts/${id}/report`, { reason }),
};

export const notificationService = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

export const documentService = {
  uploadDocument: (formData) => api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getDocuments: (params) => api.get('/documents', { params }),
  getDocument: (id) => api.get(`/documents/${id}`),
  deleteDocument: (id) => api.delete(`/documents/${id}`),
  analyzeDocument: (id, data) => api.post(`/documents/${id}/analyze`, data),
  getReport: (id) => api.get(`/documents/${id}/report`),
};

export const syllabusService = {
  getSyllabi: (params) => api.get('/syllabi', { params }),
  getSyllabus: (id) => api.get(`/syllabi/${id}`),
  createSyllabus: (data) => api.post('/syllabi', data),
  updateSyllabus: (id, data) => api.put(`/syllabi/${id}`, data),
};

export const plannerService = {
  getTasks: (params) => api.get('/planner/tasks', { params }),
  createTask: (data) => api.post('/planner/tasks', data),
  updateTask: (id, data) => api.put(`/planner/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/planner/tasks/${id}`),
  getStats: () => api.get('/planner/stats'),
};

export const notesService = {
  getNotes: (params) => api.get('/notes', { params }),
  getNote: (id) => api.get(`/notes/${id}`),
  createNote: (data) => api.post('/notes', data),
  updateNote: (id, data) => api.put(`/notes/${id}`, data),
  deleteNote: (id) => api.delete(`/notes/${id}`),
};

