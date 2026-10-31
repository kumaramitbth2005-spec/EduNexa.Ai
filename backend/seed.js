require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Course = require('./models/Course');
const Lesson = require('./models/Lesson');
const Exam = require('./models/Exam');
const StudyMaterial = require('./models/StudyMaterial');
const Post = require('./models/Post');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing
    await User.deleteMany();
    await Course.deleteMany();
    await Lesson.deleteMany();
    await Exam.deleteMany();
    await StudyMaterial.deleteMany();
    await Post.deleteMany();

    // 1. Create Users
    const password = await bcrypt.hash('Password123!', 12);

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@edunexa.com',
      password,
      role: 'admin',
      isEmailVerified: true,
      bio: 'EduNexa Platform Administrator',
    });

    const teacher = await User.create({
      name: 'Dr. Rajesh Sharma',
      email: 'teacher@edunexa.com',
      password,
      role: 'teacher',
      isEmailVerified: true,
      college: 'Indian Institute of Technology',
      branch: 'Computer Science & Engineering',
      bio: 'Senior Faculty with 12+ years teaching Operating Systems, Algorithms, and Distributed Cloud Computing.',
    });

    const student = await User.create({
      name: 'Aarav Patel',
      email: 'student@edunexa.com',
      password,
      role: 'student',
      isEmailVerified: true,
      college: 'National Institute of Technology',
      branch: 'Computer Science',
      semester: 5,
      studyStreak: 7,
      totalPoints: 850,
      skills: ['Python', 'Data Structures', 'React', 'Operating Systems'],
      bio: 'Passionate 3rd year engineering student preparing for tech placements and GATE.',
    });

    console.log('✅ Users seeded');

    // 2. Create Courses
    const course1 = await Course.create({
      title: 'Operating Systems & System Architecture Masterclass',
      description: 'Comprehensive university-aligned course covering processes, threads, concurrency, CPU scheduling algorithms, memory management with paging/segmentation, deadlocks, and file systems.',
      shortDescription: 'Master modern OS concepts, concurrency, and virtual memory.',
      category: 'programming',
      level: 'intermediate',
      semester: 4,
      duration: '16 hours',
      teacher: teacher._id,
      isPublished: true,
      enrollmentCount: 42,
      rating: 4.9,
    });

    const course2 = await Course.create({
      title: 'Full-Stack Web Engineering with React, Node.js & Cloud',
      description: 'Hands-on project-based curriculum covering modern JavaScript, React 19, Tailwind CSS, REST APIs, MongoDB, JWT authentication, and production deployment on cloud containers.',
      shortDescription: 'Build production-ready scalable web platforms from scratch.',
      category: 'web-dev',
      level: 'beginner',
      semester: 3,
      duration: '24 hours',
      teacher: teacher._id,
      isPublished: true,
      enrollmentCount: 118,
      rating: 4.8,
    });

    const course3 = await Course.create({
      title: 'Data Structures & Algorithms in Java & C++ for Placements',
      description: 'In-depth coverage of LeetCode patterns: Two Pointers, Sliding Window, Trees, Graphs (BFS/DFS/Dijkstra), Dynamic Programming, and complexity analysis.',
      shortDescription: 'Ace top-tier technical interviews with structured problem-solving.',
      category: 'dsa',
      level: 'advanced',
      semester: 5,
      duration: '30 hours',
      teacher: teacher._id,
      isPublished: true,
      enrollmentCount: 260,
      rating: 5.0,
    });

    console.log('✅ Courses seeded');

    // 3. Create Lessons for Course 1
    await Lesson.create([
      {
        title: 'Introduction to Processes vs Threads & PCB Architecture',
        course: course1._id,
        teacher: teacher._id,
        type: 'text',
        completionTime: 15,
        content: `### Processes vs Threads\n\nA **Process** is an instance of a computer program in execution. It contains its own address space, memory segments (code, data, heap, stack), and file descriptors.\n\nA **Thread** is a lightweight unit of CPU utilization that shares address space and heap with other threads of the same process, but retains its own program counter, register set, and stack.\n\n#### The Process Control Block (PCB)\nThe OS maintains a PCB containing PID, Process State, Program Counter, CPU registers, and I/O status.`,
        order: 1,
        isPublished: true,
      },
      {
        title: 'CPU Scheduling: FCFS, SJF, Round Robin & Multi-Level Queue',
        course: course1._id,
        teacher: teacher._id,
        type: 'text',
        completionTime: 20,
        content: `### CPU Scheduling Algorithms\n\n1. **FCFS (First-Come, First-Served)**: Simple non-preemptive queue. Suffer from the **Convoy Effect**.\n2. **SJF (Shortest Job First)**: Optimal average waiting time, but requires knowing or estimating burst times.\n3. **Round Robin (RR)**: Preemptive scheduling designed for time-sharing systems using a fixed time quantum.`,
        order: 2,
        isPublished: true,
      },
    ]);

    console.log('✅ Lessons seeded');

    // 4. Create Examination
    await Exam.create({
      title: 'Operating Systems Mid-Term Assessment',
      description: 'Official university curriculum midterm exam on Process Synchronization, Scheduling, and Memory Management.',
      course: course1._id,
      createdBy: teacher._id,
      type: 'mcq',
      duration: 20,
      totalMarks: 5,
      passingMarks: 3,
      isPublished: true,
      attemptLimit: 3,
      questions: [
        {
          text: 'Which of the following conditions is NOT one of the 4 Coffman conditions for deadlock?',
          type: 'mcq',
          marks: 1,
          difficulty: 'medium',
          explanation: 'The 4 Coffman conditions are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Preemption breaks deadlock rather than causing it.',
          options: [
            { text: 'Mutual Exclusion', isCorrect: false },
            { text: 'Preemption Permitted', isCorrect: true },
            { text: 'Hold and Wait', isCorrect: false },
            { text: 'Circular Wait', isCorrect: false },
          ],
        },
        {
          text: 'What memory management phenomenon occurs when total memory space exists to satisfy a request, but it is not contiguous?',
          type: 'mcq',
          marks: 1,
          difficulty: 'easy',
          explanation: 'External fragmentation occurs when free memory is broken into little chunks, making it impossible to allocate contiguous blocks.',
          options: [
            { text: 'Internal Fragmentation', isCorrect: false },
            { text: 'External Fragmentation', isCorrect: true },
            { text: 'Page Fault', isCorrect: false },
            { text: 'Thrashing', isCorrect: false },
          ],
        },
        {
          text: 'Which CPU scheduling algorithm gives the minimum average waiting time for a given set of processes?',
          type: 'mcq',
          marks: 1,
          difficulty: 'medium',
          explanation: 'Shortest Job First (SJF) is provably optimal regarding average waiting time.',
          options: [
            { text: 'Round Robin', isCorrect: false },
            { text: 'First Come First Served', isCorrect: false },
            { text: 'Shortest Job First (SJF)', isCorrect: true },
            { text: 'Priority Scheduling', isCorrect: false },
          ],
        },
        {
          text: 'What is the purpose of the Translation Lookaside Buffer (TLB) in paging?',
          type: 'mcq',
          marks: 1,
          difficulty: 'medium',
          explanation: 'The TLB is an associative hardware cache that stores recent virtual-to-physical address translations to avoid multiple memory lookups.',
          options: [
            { text: 'To cache page table translations for fast virtual address lookups', isCorrect: true },
            { text: 'To store CPU register values during context switch', isCorrect: false },
            { text: 'To handle disk swap files', isCorrect: false },
            { text: 'To detect deadlock cycles', isCorrect: false },
          ],
        },
        {
          text: 'What occurs during "Thrashing" in an operating system?',
          type: 'mcq',
          marks: 1,
          difficulty: 'hard',
          explanation: 'Thrashing occurs when the system spends more time servicing page faults and swapping pages than executing useful work.',
          options: [
            { text: 'CPU utilization hits 100% due to an infinite loop', isCorrect: false },
            { text: 'The system spends excessive time paging into and out of swap space', isCorrect: true },
            { text: 'Two processes enter a mutual exclusion race condition', isCorrect: false },
            { text: 'The disk controller fails permanently', isCorrect: false },
          ],
        },
      ],
    });

    console.log('✅ Examination seeded');

    // 5. Create Study Materials
    await StudyMaterial.create([
      {
        title: 'OS Complete Handwritten Revision Notes (Unit 1 to 5)',
        description: 'Comprehensive high-yield notes covering Semaphores, Peterson Algorithm, Banker Algorithm, and Paging calculations.',
        course: course1._id,
        uploadedBy: teacher._id,
        type: 'pdf',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        semester: 4,
        downloadCount: 84,
      },
      {
        title: 'Previous Year Question Papers (2021-2025) - Operating Systems',
        description: 'Five years of solved university mid-term and end-term examination papers with answer keys.',
        course: course1._id,
        uploadedBy: teacher._id,
        type: 'question-paper',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        semester: 4,
        downloadCount: 152,
      },
    ]);

    console.log('✅ Study Materials seeded');

    // 6. Create Community Discussions
    await Post.create([
      {
        author: student._id,
        title: 'How to intuitively understand dynamic programming memoization vs tabulation?',
        content: `I understand recursion trees, but whenever a problem asks for 2D DP (like Longest Common Subsequence or Edit Distance), I struggle to visualize the state transitions.\n\nCan someone share an intuitive mental model for transitioning from top-down memoization to bottom-up table filling?`,
        type: 'question',
        tags: ['dsa', 'algorithms', 'dynamic-programming'],
        views: 45,
        upvotes: [teacher._id],
      },
      {
        author: teacher._id,
        title: 'Mastering System Design: Distributed Caching with Redis & Consistency Models',
        content: `When scaling monolithic web applications to hundreds of thousands of concurrent users, a common architectural pitfall is **Cache Invalidation**.\n\nIn this thread, let us discuss Cache-Aside vs Write-Through strategies and how to avoid the "Thundering Herd" problem when hot keys expire.`,
        type: 'resource',
        tags: ['system-design', 'cloud', 'architecture'],
        views: 89,
        upvotes: [student._id, admin._id],
      },
    ]);

    console.log('✅ Community Discussions seeded');

    console.log('\n🎉 EduNexa Database Seed Complete!');
    console.log('--------------------------------------------------');
    console.log('Default Accounts:');
    console.log('Student : student@edunexa.com / Password123!');
    console.log('Teacher : teacher@edunexa.com / Password123!');
    console.log('Admin   : admin@edunexa.com   / Password123!');
    console.log('--------------------------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();

