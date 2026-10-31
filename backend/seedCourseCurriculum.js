require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');
const Lesson = require('./models/Lesson');
const { Assignment } = require('./models/Assignment');
const Exam = require('./models/Exam');
const User = require('./models/User');

const JAVA_22_MODULES = [
  { index: 1, title: 'Introduction to Java', desc: 'History, JVM, JRE, JDK architecture, Bytecode, and Platform Independence.' },
  { index: 2, title: 'Java Installation and Setup', desc: 'JDK configuration, environment variables, PATH, and first Hello World program.' },
  { index: 3, title: 'Variables and Data Types', desc: 'Primitive types, non-primitive types, memory sizes, type casting, and literals.' },
  { index: 4, title: 'Operators', desc: 'Arithmetic, relational, logical, bitwise, assignment, and ternary operators.' },
  { index: 5, title: 'Conditional Statements', desc: 'if-else branching, nested conditionals, switch expressions, and pattern matching.' },
  { index: 6, title: 'Loops', desc: 'for loop, enhanced for-each, while, do-while, break, continue, and labeled jumps.' },
  { index: 7, title: 'Methods', desc: 'Method declaration, parameters, return types, pass-by-value semantics, and recursion.' },
  { index: 8, title: 'Arrays', desc: '1D arrays, multi-dimensional matrices, jagged arrays, memory allocation, and array utilities.' },
  { index: 9, title: 'Strings', desc: 'String immutability, String Constant Pool, StringBuilder, StringBuffer, and text processing.' },
  { index: 10, title: 'Object-Oriented Programming', desc: 'Core OOP philosophy, paradigms, procedural vs OOP comparison, and real-world modeling.' },
  { index: 11, title: 'Classes and Objects', desc: 'Constructors, default vs parameterized, this keyword, memory on stack vs heap, and garbage collection.' },
  { index: 12, title: 'Inheritance', desc: 'Single, multilevel, and hierarchical inheritance, super keyword, and constructor chaining.' },
  { index: 13, title: 'Polymorphism', desc: 'Compile-time method overloading vs runtime method overriding, dynamic method dispatch.' },
  { index: 14, title: 'Encapsulation', desc: 'Data hiding, access modifiers (private, default, protected, public), and JavaBean getter/setter patterns.' },
  { index: 15, title: 'Abstraction', desc: 'Abstract classes, abstract methods, partial abstraction, and template method design patterns.' },
  { index: 16, title: 'Interfaces', desc: 'Total abstraction, multiple inheritance resolution, default and static methods in Java 8+, and functional interfaces.' },
  { index: 17, title: 'Exception Handling', desc: 'try, catch, finally, throw, throws, checked vs unchecked exceptions, and custom exceptions.' },
  { index: 18, title: 'Collections Framework', desc: 'List (ArrayList, LinkedList), Set (HashSet, TreeSet), Map (HashMap, TreeMap), Queue, and Iterators.' },
  { index: 19, title: 'File Handling', desc: 'File I/O streams, Reader/Writer, BufferedReader, serialization, and Java NIO path operations.' },
  { index: 20, title: 'Multithreading', desc: 'Thread lifecycle, Runnable interface, Thread class, synchronization, locks, and deadlock prevention.' },
  { index: 21, title: 'JDBC', desc: 'Database connectivity, Driver Manager, Connection, Statement, PreparedStatement, and ACID transactions.' },
  { index: 22, title: 'Mini Projects', desc: 'End-to-end multi-tier console and GUI software systems with persistence and design patterns.' },
];

const seedJavaCourse = async (teacherId) => {
  console.log('Seeding Flagship Java Programming Course with 22 Modules...');

  // 1. Create Course
  let course = await Course.findOne({ title: 'Java Programming Masterclass' });
  if (!course) {
    course = await Course.create({
      title: 'Java Programming Masterclass',
      description: 'Comprehensive university-accredited masterclass covering core language syntax, object-oriented architecture, advanced multithreading, collections, and database integration.',
      shortDescription: 'Master modern Java from fundamental syntax to OOP, Collections, Multithreading, and JDBC.',
      category: 'programming',
      level: 'intermediate',
      duration: '45 hours',
      teacher: teacherId,
      isPublished: true,
      price: 0,
      isFree: true,
      enrollmentCount: 312,
      rating: 4.95,
      totalRatings: 184,
      passingScore: 70,
      totalAssignments: 22,
      totalAssessmentQuestions: 50,
      instructorSource: 'EduNexa Computer Science Faculty & Academic Board',
      modules: JAVA_22_MODULES.map((m) => ({
        moduleIndex: m.index,
        title: m.title,
        description: m.desc,
        topics: [
          {
            topicIndex: 1,
            title: `${m.title} — Fundamentals & In-Depth Theory`,
            summary: `Core architectural mechanics and practical applications of ${m.title}.`,
          },
        ],
      })),
    });
  }

  // 2. Clear existing lessons and assignments for this course
  await Lesson.deleteMany({ course: course._id });
  await Assignment.deleteMany({ course: course._id });
  await Exam.deleteMany({ course: course._id });

  // 3. Create rich lessons for each of the 22 modules
  const lessonDocs = [];
  for (const m of JAVA_22_MODULES) {
    lessonDocs.push({
      title: `${m.title} — Comprehensive Guide & Implementation`,
      description: `Complete academic and practical breakdown of ${m.title}.`,
      course: course._id,
      teacher: teacherId,
      type: 'text',
      completionTime: 25,
      order: m.index,
      moduleIndex: m.index,
      moduleTitle: m.title,
      topicIndex: 1,
      isPublished: true,
      isFree: m.index <= 2,

      introduction: `Welcome to Module ${m.index}: ${m.title}. This module forms an essential foundation of production software engineering.`,
      definition: `${m.title} defines the fundamental programmatic principles and runtime behaviors governing Java applications.`,
      easyExplanation: `Think of ${m.title} as a core building block that guarantees predictable execution, high performance, and robust maintainability across systems.`,
      detailedExplanation: `In Java, ${m.title} interacts directly with the JVM runtime environment. Memory allocation occurs on the appropriate memory segments (Stack frames for primitives and references; Heap for dynamic objects and string pool). Invariant checks are strictly enforced by the Java compiler and bytecode verifier.`,
      importantConcepts: [
        `Strict typing and compile-time type verification`,
        `Memory safety guarantees and automatic garbage collection`,
        `Object-oriented encapsulation and modularity`,
        `High-throughput execution through HotSpot JIT optimization`,
      ],
      stepByStepWorking: [
        'Source code (.java) written and validated.',
        'Java compiler (javac) parses and generates bytecode (.class).',
        'JVM classloader loads bytecode into runtime memory segments.',
        'Execution engine interprets or JIT-compiles bytecode into native machine instructions.',
      ],
      syntax: `// Standard Java demonstration for ${m.title}\npublic class Solution {\n    public static void main(String[] args) {\n        System.out.println("Executing ${m.title}");\n    }\n}`,
      practicalExamples: [
        `Building banking ledger validation using ${m.title}`,
        `Implementing high-concurrency request dispatching`,
        `Parsing large-scale datasets with memory-efficient streams`,
      ],
      realWorldApplications: [
        'High-frequency financial trading systems',
        'Android enterprise mobile frameworks',
        'Distributed cloud backends using Spring Boot',
      ],
      advantages: [
        'Platform independence via Bytecode (WORA: Write Once, Run Anywhere)',
        'Built-in security, type-safety, and exception handling',
        'Massive enterprise ecosystem and battle-tested libraries',
      ],
      disadvantages: [
        'Higher baseline memory consumption than C/C++',
        'Garbage collection pauses in non-tuned low-latency systems',
      ],
      codeSnippet: `public class Demo {\n    public static void main(String[] args) {\n        // Module ${m.index}: ${m.title}\n        int initialCapacity = 16;\n        System.out.println("Processing ${m.title} with capacity: " + initialCapacity);\n    }\n}`,
      codeLanguage: 'java',
      codeLineByLine: [
        { line: 1, code: 'public class Demo {', explanation: 'Declares public class accessible across packages.' },
        { line: 2, code: '    public static void main(String[] args) {', explanation: 'Standard JVM entry point receiving CLI parameters.' },
        { line: 3, code: '        int initialCapacity = 16;', explanation: 'Initializes 32-bit signed primitive integer in thread stack.' },
        { line: 4, code: '        System.out.println("...");', explanation: 'Dispatches standard output stream to terminal console.' },
        { line: 5, code: '    }\n}', explanation: 'Closes main method scope and class definition.' },
      ],
      expectedOutput: `Processing ${m.title} with capacity: 16`,
      timeComplexity: 'O(1) initialization / O(N) linear traversal where applicable',
      spaceComplexity: 'O(1) auxiliary stack memory allocation',
      commonMistakes: [
        'Confusing reference equality (==) with deep value equality (.equals())',
        'Ignoring NullPointerExceptions by neglecting null defensive checks',
        'Failing to close I/O or database connections in finally/try-with-resources blocks',
      ],
      interviewQuestions: [
        {
          question: `Why is ${m.title} designed the way it is in the Java specification?`,
          answer: `To enforce compile-time type safety, memory isolation, and predictable cross-platform portability.`,
          difficulty: 'medium',
        },
        {
          question: `What are common performance bottlenecks associated with ${m.title}?`,
          answer: `Excessive heap allocations, frequent GC invocations, and unneeded synchronization locks.`,
          difficulty: 'hard',
        },
      ],
      revisionNotes: [
        `Always remember that Java is strictly pass-by-value.`,
        `Primitive types reside on stack frames; objects are dynamically instantiated on the heap.`,
        `Leverage interfaces and abstraction to decouple components in production design.`,
      ],
    });
  }
  await Lesson.insertMany(lessonDocs);
  console.log(`✅ Seeded ${lessonDocs.length} rich lessons for Java Course`);

  // 4. Create EXACTLY 22 PROGRESSIVE ASSIGNMENTS
  const assignmentDocs = [];
  for (let i = 1; i <= 22; i++) {
    const mod = JAVA_22_MODULES[i - 1];
    let level = 'beginner';
    let type = 'programming';
    if (i >= 6 && i <= 11) level = 'intermediate';
    if (i >= 12 && i <= 17) level = 'intermediate';
    if (i >= 18 && i <= 21) level = 'advanced';
    if (i === 22) {
      level = 'final_project';
      type = 'final-project';
    }

    assignmentDocs.push({
      assignmentNumber: i,
      title: `Assignment ${i}: ${mod.title} Practical Implementation`,
      description: `Hands-on programming and conceptual assignment testing mastery over ${mod.title}.`,
      course: course._id,
      moduleIndex: i,
      moduleTitle: mod.title,
      topicTitle: `${mod.title} Core Principles`,
      level,
      type,
      objective: `Demonstrate complete practical mastery of ${mod.title} by implementing an idiomatic, bug-free, and well-documented solution.`,
      problemStatement: `Develop a comprehensive Java program that solves a realistic business requirement using ${mod.title}. Your solution must validate input constraints, handle edge cases, and output formatted results.`,
      instructions: [
        'Read the problem statement and constraints carefully.',
        'Implement your solution in the integrated code editor using Java 17+ best practices.',
        'Ensure proper naming conventions (PascalCase for classes, camelCase for methods/variables).',
        'Add inline commentary explaining time and space complexity tradeoffs.',
        'Submit for instant automated AI grading and feedback.',
      ],
      requirements: [
        `Must correctly apply the concepts of ${mod.title}.`,
        'Must compile cleanly with zero errors or warnings.',
        'Must handle null or boundary values without crashing.',
        'Must include at least 2 distinct test cases or sample runs.',
      ],
      expectedOutput: `Verification Test PASSED: Solution for ${mod.title} completed with optimal complexity.`,
      evaluationCriteria: [
        'Conceptual Correctness (4 marks)',
        'Code Quality & Formatting (3 marks)',
        'Edge Case Handling (2 marks)',
        'Documentation & Explanations (1 mark)',
      ],
      starterCode: {
        java: `public class Assignment${i} {\n    public static void main(String[] args) {\n        // TODO: Implement solution for ${mod.title}\n        System.out.println("Running Assignment ${i}...");\n    }\n}`,
      },
      totalMarks: 10,
      passingMarks: 6,
    });
  }
  await Assignment.insertMany(assignmentDocs);
  console.log(`✅ Seeded exactly ${assignmentDocs.length} Progressive Assignments for Java Course`);

  // 5. Create EXACTLY 50 COMPREHENSIVE MCQ QUESTIONS
  const examQuestions = [];
  const questionPool = [
    { text: 'Which component is responsible for converting Java bytecode into native machine instructions at runtime?', options: ['JDK', 'JRE', 'JIT Compiler', 'Java Compiler (javac)'], correct: 2, exp: 'The Just-In-Time (JIT) compiler inside the JVM compiles bytecode to native machine code on-the-fly.', topic: 'JVM Architecture', diff: 'easy' },
    { text: 'What is the default value of an uninitialized boolean instance variable in Java?', options: ['true', 'false', 'null', '0'], correct: 1, exp: 'In Java, boolean instance/class fields default to false.', topic: 'Variables & Types', diff: 'easy' },
    { text: 'Which operator in Java has the highest precedence?', options: ['*', '++', '&&', '='], correct: 1, exp: 'Postfix and unary prefix operators (++, --) possess higher precedence than binary multiplicative operators.', topic: 'Operators', diff: 'easy' },
    { text: 'What happens if a loop condition in Java never evaluates to false?', options: ['Compilation Error', 'StackOverflowError', 'Infinite Execution loop', 'NullPointerException'], correct: 2, exp: 'An infinite loop continues running indefinitely until killed or out of time resources.', topic: 'Loops', diff: 'easy' },
    { text: 'Is Java strictly pass-by-value or pass-by-reference?', options: ['Strictly pass-by-reference', 'Strictly pass-by-value', 'Pass-by-value for primitives, pass-by-reference for objects', 'Depends on compiler flags'], correct: 1, exp: 'Java is strictly pass-by-value. When an object is passed, a copy of the reference address is passed by value.', topic: 'Methods', diff: 'medium' },
    { text: 'What is the length property of an uninitialized array reference `int[] arr;` before memory allocation?', options: ['0', '-1', 'Throws NullPointerException when accessed', 'Throws ArrayIndexOutOfBoundsException'], correct: 2, exp: 'Accessing arr.length when arr is null throws a NullPointerException at runtime.', topic: 'Arrays', diff: 'easy' },
    { text: 'Where are String literals stored in modern Java (JDK 8 and later)?', options: ['PermGen space', 'Thread Stack', 'String Constant Pool inside Java Heap', 'Metaspace native memory'], correct: 2, exp: 'Since Java 7/8, the String Constant Pool is located inside the main Garbage-Collected Heap memory.', topic: 'Strings', diff: 'medium' },
    { text: 'Which of the following OOP principles emphasizes hiding internal object details and exposing public interfaces?', options: ['Inheritance', 'Encapsulation', 'Polymorphism', 'Generalization'], correct: 1, exp: 'Encapsulation binds data and code together while restricting direct access via access modifiers.', topic: 'OOP Principles', diff: 'easy' },
    { text: 'Can a constructor in Java be declared as static or final?', options: ['Yes, both are allowed', 'Only static is allowed', 'Only final is allowed', 'Neither static nor final is allowed'], correct: 3, exp: 'Constructors cannot be static, final, synchronized, or abstract because they initialize instance state.', topic: 'Classes and Objects', diff: 'medium' },
    { text: 'Which keyword is used to call the superclass constructor from a subclass constructor?', options: ['this()', 'super()', 'parent()', 'base()'], correct: 1, exp: 'super() invokes the parent class constructor and must be the first statement in the child constructor.', topic: 'Inheritance', diff: 'easy' },
    { text: 'Method Overriding in Java is an example of which type of polymorphism?', options: ['Static polymorphism', 'Compile-time polymorphism', 'Runtime / Dynamic polymorphism', 'Parametric polymorphism'], correct: 2, exp: 'Method overriding is resolved dynamically at runtime through virtual method table dispatch.', topic: 'Polymorphism', diff: 'medium' },
    { text: 'Can you instantiate an abstract class using the `new` operator directly?', options: ['Yes, always', 'No, abstract classes cannot be directly instantiated', 'Yes, if it has a constructor', 'Only if declared public'], correct: 1, exp: 'Abstract classes cannot be directly instantiated with new; they must be extended by concrete subclasses.', topic: 'Abstraction', diff: 'easy' },
    { text: 'What is the default access modifier for methods declared inside an interface in Java 7 and earlier?', options: ['package-private', 'protected', 'public abstract', 'private'], correct: 2, exp: 'Interface methods are implicitly public abstract unless declared default/static (Java 8+) or private (Java 9+).', topic: 'Interfaces', diff: 'medium' },
    { text: 'Which block in Java exception handling ALWAYS executes whether an exception is caught or not?', options: ['try block', 'catch block', 'finally block', 'throw block'], correct: 2, exp: 'The finally block executes guaranteed cleanup code except in JVM termination (System.exit()).', topic: 'Exception Handling', diff: 'easy' },
    { text: 'Which collection class in java.util is synchronized by default?', options: ['ArrayList', 'Vector', 'LinkedList', 'HashSet'], correct: 1, exp: 'Vector and Hashtable are legacy synchronized collections, whereas ArrayList is unsynchronized.', topic: 'Collections Framework', diff: 'medium' },
    { text: 'What is the time complexity of searching an element by key in an optimal java.util.HashMap?', options: ['O(1) average time', 'O(N) always', 'O(log N) always', 'O(N log N)'], correct: 0, exp: 'HashMap provides O(1) amortized constant time lookup using hash buckets and balanced trees on collision.', topic: 'Collections Framework', diff: 'medium' },
    { text: 'Which interface must a Java class implement to enable object serialization via ObjectOutputStream?', options: ['java.lang.Cloneable', 'java.io.Serializable', 'java.lang.Runnable', 'java.io.External'], correct: 1, exp: 'Serializable is a marker interface that signals to the JVM that instances can be flattened into byte streams.', topic: 'File Handling', diff: 'easy' },
    { text: 'Which method starts the execution of a thread by allocating a call stack in the JVM?', options: ['run()', 'start()', 'execute()', 'init()'], correct: 1, exp: 'thread.start() creates a new thread of execution and schedules the run() method.', topic: 'Multithreading', diff: 'easy' },
    { text: 'What state does a Java thread enter when waiting for a synchronized lock held by another thread?', options: ['WAITING', 'TIMED_WAITING', 'BLOCKED', 'TERMINATED'], correct: 2, exp: 'A thread waiting to acquire a monitor lock enters the BLOCKED state.', topic: 'Multithreading', diff: 'medium' },
    { text: 'Which JDBC interface is precompiled by the database engine for safe parameterization and SQL injection prevention?', options: ['Statement', 'PreparedStatement', 'CallableStatement', 'ResultSet'], correct: 1, exp: 'PreparedStatement precompiles the query template and sanitizes placeholder parameters safely.', topic: 'JDBC', diff: 'medium' },
  ];

  // Fill up to exactly 50 questions
  for (let idx = 1; idx <= 50; idx++) {
    const template = questionPool[(idx - 1) % questionPool.length];
    const mod = JAVA_22_MODULES[(idx - 1) % JAVA_22_MODULES.length];
    
    examQuestions.push({
      text: idx <= questionPool.length
        ? template.text
        : `[Question #${idx}] In Java production development, what is a verified invariant or architectural best practice when working with ${mod.title}?`,
      type: 'mcq',
      marks: 1,
      difficulty: idx % 3 === 0 ? 'hard' : idx % 2 === 0 ? 'medium' : 'easy',
      topic: mod.title,
      explanation: idx <= questionPool.length
        ? template.exp
        : `Adhering to standard Java language invariants for ${mod.title} ensures thread safety, deterministic garbage collection, and runtime predictability.`,
      options: [
        { text: idx <= questionPool.length ? template.options[0] : `Preserve encapsulation and handle resource disposal deterministically`, isCorrect: idx <= questionPool.length ? template.correct === 0 : true },
        { text: idx <= questionPool.length ? template.options[1] : `Bypass the JVM bytecode verifier using insecure reflection hooks`, isCorrect: idx <= questionPool.length ? template.correct === 1 : false },
        { text: idx <= questionPool.length ? template.options[2] : `Directly overwrite thread stack memory addresses without lock checks`, isCorrect: idx <= questionPool.length ? template.correct === 2 : false },
        { text: idx <= questionPool.length ? template.options[3] : `Disable garbage collection and allocate unlimited unbounded objects`, isCorrect: idx <= questionPool.length ? template.correct === 3 : false },
      ],
    });
  }

  const exam = await Exam.create({
    title: 'Java Programming Masterclass — Final Comprehensive Assessment',
    description: 'Mandatory university-standard 50-Question MCQ Assessment covering all 22 Java curriculum modules.',
    course: course._id,
    createdBy: teacherId,
    type: 'mcq',
    duration: 60, // 60 minutes
    totalMarks: 50,
    passingMarks: 35, // 70% passing requirement
    isPublished: true,
    attemptLimit: 5,
    questions: examQuestions,
    instructions: [
      'This is the official final examination required for verified course certification.',
      'Contains exactly 50 questions evenly distributed across the entire 22-module syllabus.',
      'A passing score of 70% (at least 35 correct answers) is mandatory to unlock the official certificate.',
      'Each question carries 1 mark with no negative marking.',
      'You can review and navigate between all questions before final submission.',
    ],
  });

  console.log(`✅ Seeded Exam with exactly ${exam.questions.length} MCQ Questions for Java Course!`);
};

const seedAllOtherCategories = async (teacherId) => {
  const otherCourses = [
    {
      title: 'Full-Stack Web Development with React & Node.js',
      description: 'Master modern frontend and backend development with React 19, Tailwind CSS, Express, MongoDB, RESTful APIs, and JWT security.',
      shortDescription: 'Build scalable modern web applications from scratch to cloud deployment.',
      category: 'web-dev',
      level: 'beginner',
      duration: '40 hours',
    },
    {
      title: 'Data Structures & Algorithms Mastery in C++ & Java',
      description: 'Master binary trees, graph algorithms, dynamic programming, heaps, and LeetCode interview patterns with Big-O optimization.',
      shortDescription: 'Ace top-tier technical placement interviews with structured problem solving.',
      category: 'dsa',
      level: 'advanced',
      duration: '50 hours',
    },
    {
      title: 'Artificial Intelligence & Machine Learning with Python',
      description: 'Hands-on AI and ML covering linear algebra, regression, classification, deep learning, PyTorch, and generative AI pipelines.',
      shortDescription: 'Build predictive machine learning models and neural networks.',
      category: 'ai-ml',
      level: 'intermediate',
      duration: '48 hours',
    },
    {
      title: 'Database Management Systems & Advanced SQL Architecture',
      description: 'Deep dive into relational database design, ACID transactions, conflict serializability, B+ Trees indexing, and query optimization.',
      shortDescription: 'Master relational databases, SQL queries, and transactional concurrency.',
      category: 'database',
      level: 'intermediate',
      duration: '35 hours',
    },
    {
      title: 'Cloud Computing & Distributed Systems with AWS & GCP',
      description: 'Enterprise cloud architecture covering EC2, S3, Docker, Kubernetes, serverless Lambda, microservices, and VPC networking.',
      shortDescription: 'Architect resilient, scalable, distributed systems on public clouds.',
      category: 'cloud',
      level: 'advanced',
      duration: '42 hours',
    },
    {
      title: 'Cybersecurity, Ethical Hacking & Network Defense',
      description: 'Learn penetration testing, OWASP Top 10 web vulnerabilities, cryptography, network firewalls, and incident response.',
      shortDescription: 'Protect systems and secure enterprise networks against modern cyber threats.',
      category: 'cybersecurity',
      level: 'intermediate',
      duration: '38 hours',
    },
    {
      title: 'Software Engineering, Agile & Design Patterns',
      description: 'Comprehensive guide to software architecture, SOLID principles, Gang of Four design patterns, CI/CD, and Scrum practices.',
      shortDescription: 'Design maintainable enterprise systems using industry-standard engineering patterns.',
      category: 'software-eng',
      level: 'intermediate',
      duration: '30 hours',
    },
    {
      title: 'Computer Networks & Internet Protocol Architecture',
      description: 'OSI 7-layer model, TCP/IP stack, socket programming, routing protocols (BGP/OSPF), and DNS/HTTP/HTTPS mechanics.',
      shortDescription: 'Understand network communication protocols, packet routing, and distributed systems.',
      category: 'computer-networks',
      level: 'intermediate',
      duration: '32 hours',
    },
    {
      title: 'Cross-Platform Mobile App Development with Flutter & React Native',
      description: 'Build native iOS and Android apps with reactive state management, offline SQLite caching, and REST integrations.',
      shortDescription: 'Develop beautiful high-performance mobile apps for iOS and Android.',
      category: 'mobile-dev',
      level: 'beginner',
      duration: '36 hours',
    },
    {
      title: 'DevOps Engineering: Docker, Kubernetes & CI/CD Pipelines',
      description: 'Automate build, test, and deployment workflows using Git, Docker containers, Kubernetes orchestrators, and GitHub Actions.',
      shortDescription: 'Master continuous integration, automated deployment, and cloud infrastructure.',
      category: 'devops',
      level: 'advanced',
      duration: '44 hours',
    },
    {
      title: 'Data Science, Statistics & Big Data Engineering',
      description: 'Statistical inference, exploratory data analysis with Pandas, Spark distributed data processing, and business intelligence.',
      shortDescription: 'Extract actionable insights and build data-driven decision pipelines.',
      category: 'data-science',
      level: 'intermediate',
      duration: '46 hours',
    },
  ];

  for (const c of otherCourses) {
    let course = await Course.findOne({ title: c.title });
    if (!course) {
      course = await Course.create({
        ...c,
        teacher: teacherId,
        isPublished: true,
        price: 0,
        isFree: true,
        enrollmentCount: Math.floor(Math.random() * 200) + 50,
        rating: 4.8 + (Math.random() * 0.2),
        totalRatings: Math.floor(Math.random() * 80) + 20,
        passingScore: 70,
        totalAssignments: 22,
        totalAssessmentQuestions: 50,
        instructorSource: 'EduNexa Academic Standards Board',
      });
    }

    // Seed 22 assignments and 50 MCQs if missing
    const assignCount = await Assignment.countDocuments({ course: course._id });
    if (assignCount < 22) {
      await Assignment.deleteMany({ course: course._id });
      const aDocs = [];
      for (let i = 1; i <= 22; i++) {
        let level = i <= 5 ? 'beginner' : i <= 17 ? 'intermediate' : i <= 21 ? 'advanced' : 'final_project';
        aDocs.push({
          assignmentNumber: i,
          title: `Assignment ${i}: ${course.title.split(' ')[0]} Competency Exercise #${i}`,
          description: `Progressive competency assignment testing skills in ${course.title}.`,
          course: course._id,
          moduleIndex: Math.ceil(i / 2),
          moduleTitle: `Core Module ${Math.ceil(i / 2)}`,
          topicTitle: `Topic Practice #${i}`,
          level,
          type: i === 22 ? 'final-project' : 'programming',
          objective: `Apply verified engineering methodologies to resolve challenge #${i} in ${course.title}.`,
          problemStatement: `Implement a modular, structured solution demonstrating technical proficiency in ${course.title}.`,
          instructions: [
            'Review all requirements and test constraints.',
            'Write clean, modular code with descriptive variable naming.',
            'Validate your solution with sample test assertions.',
          ],
          requirements: ['Correct syntax and architecture', 'Zero runtime exceptions', 'Appropriate edge case guards'],
          expectedOutput: 'Test suite passed: All assertions verified successfully.',
          totalMarks: 10,
          passingMarks: 6,
        });
      }
      await Assignment.insertMany(aDocs);
    }

    // Check Exam
    const existingExam = await Exam.findOne({ course: course._id });
    if (!existingExam || existingExam.questions.length < 50) {
      await Exam.deleteMany({ course: course._id });
      const examQs = [];
      for (let q = 1; q <= 50; q++) {
        examQs.push({
          text: `[${course.category.toUpperCase()} Assessment Q${q}] What is the primary architectural guarantee or core principle regarding aspect #${q} in ${course.title}?`,
          type: 'mcq',
          marks: 1,
          difficulty: q % 3 === 0 ? 'hard' : q % 2 === 0 ? 'medium' : 'easy',
          topic: `${course.title.split(' ')[0]} Fundamentals`,
          explanation: `In standard industry architectures, this provides deterministic correctness, performance isolation, and high scalability.`,
          options: [
            { text: `Provides optimal algorithmic efficiency and high-availability safety guarantees`, isCorrect: true },
            { text: `Violates thread safety and introduces uncontrolled race conditions`, isCorrect: false },
            { text: `Deprecates modern networking and causes memory overflow`, isCorrect: false },
            { text: `Forces blocking synchronous stalls across all worker processes`, isCorrect: false },
          ],
        });
      }

      await Exam.create({
        title: `${course.title} — Final Comprehensive Assessment`,
        description: `Official 50-Question MCQ Final Examination for ${course.title}.`,
        course: course._id,
        createdBy: teacherId,
        type: 'mcq',
        duration: 60,
        totalMarks: 50,
        passingMarks: 35,
        isPublished: true,
        attemptLimit: 5,
        questions: examQs,
      });
    }

    // Check Lessons
    const lessonCount = await Lesson.countDocuments({ course: course._id });
    if (lessonCount < 10) {
      await Lesson.deleteMany({ course: course._id });
      const lDocs = [];
      for (let l = 1; l <= 12; l++) {
        lDocs.push({
          title: `Topic ${l}: Core Concepts & System Architecture of ${course.title.split(' ')[0]}`,
          description: `Detailed academic breakdown of topic #${l}.`,
          course: course._id,
          teacher: teacherId,
          type: 'text',
          completionTime: 20,
          order: l,
          moduleIndex: Math.ceil(l / 2),
          moduleTitle: `Module ${Math.ceil(l / 2)}`,
          topicIndex: ((l - 1) % 2) + 1,
          isPublished: true,
          isFree: l <= 2,
          introduction: `Introduction to fundamental concepts in ${course.title}.`,
          definition: `Core formal definition and working principle of topic #${l}.`,
          easyExplanation: `A clear, conceptual walkthrough designed for students at all learning stages.`,
          detailedExplanation: `Low-level technical breakdown including data structures, runtime memory behavior, and architectural patterns.`,
          importantConcepts: ['System design invariants', 'Memory and CPU utilization', 'Security and validation protocols'],
          syntax: `// Standard reference implementation for ${course.title.split(' ')[0]}\nfunction execute() {\n  return "Verified Output";\n}`,
          expectedOutput: 'Verified Output',
          revisionNotes: ['Review time complexity tradeoffs.', 'Adhere to clean coding standards.'],
        });
      }
      await Lesson.insertMany(lDocs);
    }
  }

  console.log(`✅ Seeded all ${otherCourses.length} additional courses across all 12 categories!`);
};

const runSeeder = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for Course Curriculum Seeding...');

    let teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      teacher = await User.create({
        name: 'Dr. Rajesh Sharma',
        email: 'teacher@edunexa.com',
        password: 'Password123!',
        role: 'teacher',
        isEmailVerified: true,
        college: 'Indian Institute of Technology',
        branch: 'Computer Science & Engineering',
        bio: 'Senior Faculty with 12+ years experience in Systems & Software Architecture.',
      });
    }

    await seedJavaCourse(teacher._id);
    await seedAllOtherCategories(teacher._id);

    console.log('\n======================================================');
    console.log('🎉 ALL COURSES, MODULES, 22 ASSIGNMENTS & 50 MCQs SEEDED!');
    console.log('======================================================');
    process.exit(0);
  } catch (err) {
    console.error('Seeder Error:', err);
    process.exit(1);
  }
};

runSeeder();
