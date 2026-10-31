/**
 * seedEducationalContent.js
 * Seeds comprehensive Subject Notes (17-section structure) and DSA Modules (16-section structure)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const SubjectNote = require('./models/SubjectNote');
const DsaTopic = require('./models/DsaTopic');
const User = require('./models/User');

const seedContent = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for educational content seeding...');

    const teacher = await User.findOne({ role: 'teacher' });
    const teacherId = teacher ? teacher._id : null;

    // ── 1. SEED SUBJECT-WISE & TOPIC-WISE NOTES ──────────────────────────────
    console.log('Seeding Subject Notes...');

    const sampleSubjectNotes = [
      {
        educationLevel: 'undergraduate',
        degree: 'B.Tech',
        branch: 'Computer Science & Engineering',
        semester: 5,
        subject: 'Operating Systems',
        subjectCode: 'CS501',
        unit: 'Unit 1: Process Management & CPU Scheduling',
        topic: 'CPU Scheduling: Preemptive vs Non-Preemptive Algorithms',
        order: 1,
        introduction:
          'CPU scheduling is the fundamental operating system process that determines which of the ready processes in memory should be assigned CPU execution cycles. It directly dictates system throughput, latency, and CPU utilization.',
        simpleExplanation:
          'Think of the CPU like a single chef in a busy restaurant kitchen. CPU scheduling is the order in which the chef works on orders: does the chef finish one dish completely before starting the next (Non-preemptive), or does the chef pause when a quick order comes in (Preemptive)?',
        detailedExplanation:
          'Whenever the CPU becomes idle, the operating system must select one of the processes in the ready queue to be executed. The selection process is carried out by the short-term scheduler (or CPU scheduler). In non-preemptive scheduling, once a process is given the CPU, it retains control until it terminates or switches to the waiting state. In preemptive scheduling, the OS kernel can interrupt a currently running process when a higher-priority process arrives or when a time-slice (quantum) expires.',
        hindiExplanation:
          'सीपीयू शेड्यूलिंग ऑपरेटिंग सिस्टम का वह मुख्य नियम है जो तय करता है कि तैयार प्रक्रियाओं (processes) में से किसे और कब सीपीयू का समय दिया जाएगा। प्रीमेप्टिव शेड्यूलिंग में, अधिक प्राथमिकता वाला काम आने पर चल रहे काम को बीच में रोककर सीपीयू दूसरे काम को दिया जा सकता है।',
        definitions: [
          {
            term: 'Preemptive Scheduling',
            definition:
              'A scheduling mechanism where the OS interrupts a running process in favor of another based on priority or timer expiration.',
          },
          {
            term: 'Non-Preemptive Scheduling',
            definition:
              'A scheduling policy where a running process holds the CPU until it voluntarily yields via completion or I/O request.',
          },
          {
            term: 'Turnaround Time (TAT)',
            definition: 'The total time elapsed from process arrival to its final completion (TAT = Completion Time - Arrival Time).',
          },
          {
            term: 'Waiting Time (WT)',
            definition: 'The total time a process spends waiting in the ready queue (WT = Turnaround Time - Burst Time).',
          },
        ],
        keyConcepts: [
          'First-Come, First-Served (FCFS) suffering from Convoy Effect',
          'Shortest Job First (SJF) and its preemptive form Shortest Remaining Time First (SRTF)',
          'Round Robin (RR) with time quantum tuning',
          'Priority Scheduling and Starvation prevention via Aging',
        ],
        workingPrinciples:
          'The scheduler selects a process from the Ready Queue using algorithms like FCFS, SJF, or Round Robin. The dispatcher then performs context switching, switching to user mode, and jumping to the proper location in the program.',
        stepByStepExamples: [
          {
            title: 'Round Robin Execution Example (Quantum = 2ms)',
            description: 'Three processes P1 (Burst=5ms), P2 (Burst=3ms), P3 (Burst=1ms) arrive at Time=0.',
            steps: [
              'Time 0-2ms: P1 executes for 2ms. Remaining burst for P1 = 3ms. Ready queue: [P2, P3, P1]',
              'Time 2-4ms: P2 executes for 2ms. Remaining burst for P2 = 1ms. Ready queue: [P3, P1, P2]',
              'Time 4-5ms: P3 executes for 1ms and completes at t=5ms. Ready queue: [P1, P2]',
              'Time 5-7ms: P1 executes for 2ms. Remaining burst for P1 = 1ms. Ready queue: [P2, P1]',
              'Time 7-8ms: P2 executes for 1ms and completes at t=8ms. Ready queue: [P1]',
              'Time 8-9ms: P1 executes for 1ms and completes at t=9ms.',
            ],
          },
        ],
        realLifeApplications: [
          'Linux Completely Fair Scheduler (CFS) for desktop responsiveness',
          'Cloud hypervisors allocating vCPU cycles among Docker containers and VMs',
          'Mobile operating systems prioritizing foreground user interface thread rendering',
        ],
        advantagesAndDisadvantages: {
          advantages: [
            'Preemptive RR ensures fair time allocation and high interactive responsiveness',
            'SJF is provably optimal for minimizing average waiting time',
          ],
          disadvantages: [
            'High context switching overhead in preemptive algorithms with tiny quanta',
            'Starvation of longer processes in strict priority or SJF scheduling',
          ],
        },
        visualDiagram:
          'Gantt Chart Representation:\n[ P1 (0-2) ] -> [ P2 (2-4) ] -> [ P3 (4-5) ] -> [ P1 (5-7) ] -> [ P2 (7-8) ] -> [ P1 (8-9) ]\nAverage Waiting Time = ( (9-5) + (8-3) + (5-1) ) / 3 = (4 + 5 + 4) / 3 = 4.33 ms',
        formulas: [
          {
            name: 'Turnaround Time',
            formula: 'TAT = Completion Time - Arrival Time',
            explanation: 'Total duration spent inside the operating system.',
          },
          {
            name: 'Waiting Time',
            formula: 'WT = Turnaround Time - Burst Time',
            explanation: 'Duration spent purely in ready state waiting for execution.',
          },
        ],
        examQuestions: {
          shortAnswer: [
            'Differentiate between Preemptive and Non-Preemptive scheduling with 2 examples each.',
            'What is the Convoy Effect in FCFS scheduling?',
            'Explain how aging prevents indefinite starvation in priority scheduling.',
          ],
          longAnswer: [
            'Given processes P1, P2, P3, P4 with arrival times and burst times, draw the Gantt chart for Round Robin (q=2) and calculate the average Turnaround Time and Waiting Time.',
            'Discuss the role of the Dispatcher and explain the components of Dispatch Latency.',
          ],
          mcqs: [
            {
              question: 'Which scheduling algorithm is provably optimal in terms of minimizing average waiting time?',
              options: ['Round Robin', 'First Come First Served', 'Shortest Job First', 'Priority Scheduling'],
              answer: 'Shortest Job First',
              explanation: 'SJF schedules the shortest job first, leading to the minimal average waiting time.',
            },
            {
              question: 'In Round Robin scheduling, what happens if the time quantum is extremely large?',
              options: ['It degrades into FCFS', 'Context switches increase', 'System crashes', 'Throughput reaches 100%'],
              answer: 'It degrades into FCFS',
              explanation: 'When quantum exceeds the longest process burst time, processes execute sequentially without interruption, behaving like FCFS.',
            },
          ],
        },
        quickRevisionNotes: [
          'Preemptive: Process can be forcibly stopped (e.g. Round Robin, SRTF).',
          'Non-preemptive: Process runs until voluntary yield (e.g. FCFS, non-preemptive SJF).',
          'Aging: Gradually increasing priority of aging processes prevents starvation.',
          'FCFS suffers from the Convoy Effect where small jobs wait behind a massive CPU burst.',
        ],
        learningResources: [
          { title: 'Silberschatz OS Concepts Chapter 5', url: 'https://os-book.com', type: 'book' },
          { title: 'MIT 6.004 CPU Scheduling Lecture', url: 'https://ocw.mit.edu', type: 'video' },
        ],
        createdBy: teacherId,
      },
      {
        educationLevel: 'undergraduate',
        degree: 'B.Tech',
        branch: 'Computer Science & Engineering',
        semester: 5,
        subject: 'Database Management Systems',
        subjectCode: 'CS502',
        unit: 'Unit 2: Relational Database Design & Normalization',
        topic: 'Database Normalization: 1NF, 2NF, 3NF, and BCNF',
        order: 1,
        introduction:
          'Normalization is a systematic approach to decomposing relational tables to minimize data redundancy and eliminate undesirable update, insertion, and deletion anomalies.',
        simpleExplanation:
          'Imagine storing a student name, college address, course name, and teacher phone number in one single spreadsheet sheet. If a teacher changes phone numbers, you have to update thousands of rows! Normalization breaks this into clean, connected tables.',
        detailedExplanation:
          'Normalization organizes database tables based on functional dependencies. 1NF guarantees atomic cell values. 2NF removes partial functional dependencies on candidate keys. 3NF eliminates transitive dependencies (non-prime attribute determining another non-prime attribute). Boyce-Codd Normal Form (BCNF) is a stricter variant where for every functional dependency X -> Y, X must be a super key.',
        hindiExplanation:
          'डेटाबेस नॉर्मलाइजेशन तालिकाओं (tables) को व्यवस्थित करने की वैज्ञानिक तकनीक है जिससे डेटा का दोहराव (redundancy) कम होता है और इन्सर्ट, डिलीट और अपडेट की त्रुटियाँ समाप्त होती हैं।',
        definitions: [
          {
            term: 'Functional Dependency (X -> Y)',
            definition: 'A constraint between two sets of attributes in a relation where the value of X uniquely determines Y.',
          },
          {
            term: 'First Normal Form (1NF)',
            definition: 'A relation where every attribute contains only atomic (indivisible) values and no repeating groups.',
          },
          {
            term: 'Second Normal Form (2NF)',
            definition: 'The relation is in 1NF and no non-prime attribute is partially dependent on any candidate key.',
          },
          {
            term: 'Third Normal Form (3NF)',
            definition: 'The relation is in 2NF and no transitive dependency exists (for every X -> Y, either X is a superkey or Y is prime).',
          },
        ],
        keyConcepts: [
          'Anomalies: Insertion Anomaly, Deletion Anomaly, Update Anomaly',
          'Candidate Key vs Prime Attributes',
          'Lossless Join Decomposition property',
          'Dependency Preservation property',
        ],
        workingPrinciples:
          'Decompose non-normalized relations R into R1 and R2 using functional dependency closures, ensuring R1 ∩ R2 forms a superkey in at least one decomposed relation.',
        stepByStepExamples: [
          {
            title: 'Decomposing 2NF to 3NF',
            description: 'Relation R(EmpID, DeptID, DeptName) with FDs: EmpID -> DeptID, DeptID -> DeptName.',
            steps: [
              'EmpID is the candidate key.',
              'DeptID -> DeptName is a transitive dependency because DeptName (non-prime) is determined by DeptID (non-prime).',
              'Decompose into Table 1: Employee(EmpID, DeptID) with EmpID as primary key.',
              'Decompose into Table 2: Department(DeptID, DeptName) with DeptID as primary key.',
              'Transitive dependency is eliminated; both tables are now in 3NF.',
            ],
          },
        ],
        realLifeApplications: [
          'E-commerce order management schema dividing customers, orders, payments, and shipments',
          'Banking transaction ledgers preventing duplicate customer profile updates',
          'Enterprise ERP systems maintaining relational integrity across departments',
        ],
        advantagesAndDisadvantages: {
          advantages: [
            'Dramatically reduces data redundancy and storage footprint',
            'Prevents database update anomalies and corrupted state',
          ],
          disadvantages: [
            'High normalization levels require multiple JOINs, slightly reducing read query speed',
            'OLAP data warehouses often prefer de-normalization (Star schemas) for reporting',
          ],
        },
        visualDiagram:
          'Dependency Hierarchy:\n[ 1NF: Atomic Values ]\n   ↓ (Remove Partial Dependencies)\n[ 2NF: Full Functional Dependency ]\n   ↓ (Remove Transitive Dependencies)\n[ 3NF: No Non-Prime Determines Non-Prime ]\n   ↓ (Strict Superkey for all FDs)\n[ BCNF: Pure Determinant Superkeys ]',
        formulas: [
          {
            name: 'Lossless Decomposition Test',
            formula: 'R1 ∩ R2 -> R1 OR R1 ∩ R2 -> R2',
            explanation: 'The common attributes must form a superkey of at least one sub-relation.',
          },
        ],
        examQuestions: {
          shortAnswer: [
            'State the conditions for a relation to be in Boyce-Codd Normal Form (BCNF).',
            'Why is BCNF considered stricter than 3NF?',
            'What is a partial dependency and in which normal form is it eliminated?',
          ],
          longAnswer: [
            'Given relation R(A, B, C, D, E) with F = { A -> BC, CD -> E, B -> D, E -> A }, find candidate keys and determine the highest normal form.',
          ],
          mcqs: [
            {
              question: 'A table where non-prime attributes depend on a part of a composite primary key violates which normal form?',
              options: ['1NF', '2NF', '3NF', 'BCNF'],
              answer: '2NF',
              explanation: 'Partial dependencies on composite primary keys are strictly disallowed in 2NF.',
            },
          ],
        },
        quickRevisionNotes: [
          '1NF = Atomic values only, no repeating arrays.',
          '2NF = 1NF + No partial dependencies.',
          '3NF = 2NF + No transitive dependencies.',
          'BCNF = In every X -> Y, X must be a superkey.',
        ],
        learningResources: [
          { title: 'Navathe Database Systems 7th Edition', url: 'https://pearson.com', type: 'book' },
        ],
        createdBy: teacherId,
      },
    ];

    for (const noteData of sampleSubjectNotes) {
      await SubjectNote.findOneAndUpdate(
        { subject: noteData.subject, topic: noteData.topic },
        noteData,
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Seeded ${sampleSubjectNotes.length} Comprehensive Subject Notes.`);

    // ── 2. SEED COMPLETE 14-MODULE DSA TOPICS ────────────────────────────────
    console.log('Seeding 14-Module DSA Curriculum Topics...');

    const sampleDsaTopics = [
      {
        moduleId: 2,
        moduleTitle: 'Module 2: Time and Space Complexity',
        topicId: 'big-o-notation-analysis',
        title: 'Big O Notation & Algorithmic Complexity Analysis',
        order: 1,
        difficulty: 'beginner',
        overview:
          'Big O notation is the standard mathematical notation used to classify algorithms according to how their run time or space requirements grow as the input size (N) grows.',
        importance:
          'Fundamental prerequisite for all technical coding interviews. Interviewers prioritize optimal time and space complexity over brute force code.',
        prerequisites: ['Basic loops and conditional statements', 'Elementary algebra'],
        conceptEnglish:
          'Big O measures upper bound complexity in the worst-case scenario. Common classes: O(1) constant, O(log N) logarithmic, O(N) linear, O(N log N) linearithmic, O(N^2) quadratic, and O(2^N) exponential.',
        conceptHindi:
          'Big O नोटेशन यह मापता है कि जैसे-जैसे इनपुट साइज़ बढ़ता है, प्रोग्राम का चलने का समय (Time) और मेमोरी (Space) किस दर से बढ़ती है। यह हमेशा सबसे खराब स्थिति (Worst-case) का ऊपरी दायरा बताता है।',
        syntaxAndOperations:
          'Drop constant coefficients: O(2N + 5) becomes O(N).\nDrop non-dominant terms: O(N^2 + N) becomes O(N^2).\nNested loops multiply: for(i=0..N) for(j=0..N) -> O(N^2).',
        stepByStepWorking:
          '1. Count operations as function of input size N.\n2. Identify the fastest-growing term.\n3. Remove constant factors.\n4. State final Big O notation.',
        dryRun: {
          input: 'Array of size N = 1000 with Binary Search',
          steps: [
            { step: 1, state: 'N = 1000', explanation: 'First search splits array into 500 elements' },
            { step: 2, state: 'N = 500', explanation: 'Second iteration splits to 250 elements' },
            { step: 3, state: 'N = 250', explanation: 'Third iteration splits to 125 elements' },
            { step: 10, state: 'N = 1', explanation: 'At most 10 comparisons needed (2^10 = 1024)' },
          ],
          output: 'Logarithmic growth: O(log2 N) = 10 operations for N=1000',
        },
        complexity: {
          time: 'O(log N) for binary reduction, O(1) for arithmetic evaluation',
          space: 'O(1) auxiliary space',
          bestCase: 'O(1)',
          worstCase: 'O(log N)',
        },
        codeImplementations: {
          java: `// Java Binary Search demonstrating O(log N) Time and O(1) Space
public class ComplexityDemo {
    public static int binarySearch(int[] arr, int target) {
        int low = 0, high = arr.length - 1;
        
        while (low <= high) {
            // Avoid integer overflow
            int mid = low + (high - low) / 2;
            
            if (arr[mid] == target) {
                return mid; // Element found: O(1) in best case
            } else if (arr[mid] < target) {
                low = mid + 1; // Discard left half
            } else {
                high = mid - 1; // Discard right half
            }
        }
        return -1; // Element not present
    }

    public static void main(String[] args) {
        int[] sortedData = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
        int target = 23;
        int resultIndex = binarySearch(sortedData, target);
        System.out.println("Element " + target + " found at index: " + resultIndex);
    }
}`,
          cpp: `// C++ Implementation
#include <iostream>
#include <vector>

int binarySearch(const std::vector<int>& arr, int target) {
    int low = 0, high = arr.size() - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`,
          python: `# Python Implementation
def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`,
          javascript: `// JavaScript Implementation
function binarySearch(arr, target) {
  let low = 0, high = arr.length - 1;
  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`,
        },
        lineByLineExplanation: [
          { lineOrBlock: 'int mid = low + (high - low) / 2;', explanation: 'Calculates midpoint safely avoiding (low+high) integer overflow bug.' },
          { lineOrBlock: 'low <= high', explanation: 'Continues halving search space until pointers cross.' },
          { lineOrBlock: 'low = mid + 1;', explanation: 'Discards left half when target is greater than mid value.' },
        ],
        commonMistakes: [
          'Using (low + high) / 2 which can overflow in Java for large arrays (> 2^30).',
          'Forgetting that Binary Search strictly requires sorted input data.',
        ],
        interviewQuestions: [
          { question: 'Why does Binary Search have O(log N) complexity?', company: 'Google', hint: 'Each step divides the remaining search elements by 2.' },
          { question: 'What is the space complexity of recursive vs iterative binary search?', company: 'Amazon', hint: 'Recursive takes O(log N) stack frames; iterative takes O(1).' },
        ],
        practiceProblems: [
          { title: 'Binary Search', difficulty: 'Easy', platform: 'LeetCode 704', link: 'https://leetcode.com/problems/binary-search/' },
          { title: 'Search in Rotated Sorted Array', difficulty: 'Medium', platform: 'LeetCode 33', link: 'https://leetcode.com/problems/search-in-rotated-sorted-array/' },
        ],
        summary: 'Big O characterizes scalability. Binary search halves the search space each step, achieving O(log N) runtime.',
        nextSteps: ['Module 3: Two Pointers Technique on Arrays and Strings'],
      },
      {
        moduleId: 3,
        moduleTitle: 'Module 3: Arrays and Strings',
        topicId: 'two-pointers-technique',
        title: 'Two Pointers Pattern (Opposite Direction & Fast-Slow)',
        order: 1,
        difficulty: 'intermediate',
        overview:
          'The Two Pointers pattern involves iterating through a collection using two indices simultaneously—often moving towards each other, in the same direction at different speeds, or from different arrays.',
        importance:
          'Enables converting brute-force O(N^2) quadratic nested loops into optimal O(N) linear solutions with zero extra auxiliary memory O(1).',
        prerequisites: ['Big O Complexity Analysis', 'Basic 1D array indexing'],
        conceptEnglish:
          'Instead of checking every pair with nested loops, start one pointer at index 0 and another pointer at index (N-1). Move pointers inward based on comparison criteria until they meet.',
        conceptHindi:
          'दो पॉइंटर्स तकनीक में, दो अलग-अलग इंडेक्स का उपयोग करके सरणी (array) की जांच की जाती है। यह नेस्टेड लूप्स O(N^2) को केवल एक पास O(N) में हल करने में मदद करता है।',
        syntaxAndOperations:
          'int left = 0, right = arr.length - 1;\nwhile(left < right) { if(condition) left++; else right--; }',
        stepByStepWorking:
          '1. Sort array if not already sorted.\n2. Place left at index 0 and right at index (n-1).\n3. Compute sum = arr[left] + arr[right].\n4. If sum == target: return pair.\n5. If sum < target: increment left.\n6. If sum > target: decrement right.',
        dryRun: {
          input: 'arr = [1, 2, 4, 7, 11, 15], target = 15',
          steps: [
            { step: 1, state: 'left=0 (val 1), right=5 (val 15)', explanation: 'Sum = 1 + 15 = 16 > 15. Decrement right.' },
            { step: 2, state: 'left=0 (val 1), right=4 (val 11)', explanation: 'Sum = 1 + 11 = 12 < 15. Increment left.' },
            { step: 3, state: 'left=1 (val 2), right=4 (val 11)', explanation: 'Sum = 2 + 11 = 13 < 15. Increment left.' },
            { step: 4, state: 'left=2 (val 4), right=4 (val 11)', explanation: 'Sum = 4 + 11 = 15 == Target! Pair found.' },
          ],
          output: 'Indices [2, 4] with values 4 and 11',
        },
        complexity: {
          time: 'O(N) single pass through the array',
          space: 'O(1) auxiliary space (in-place pointers)',
          bestCase: 'O(1)',
          worstCase: 'O(N)',
        },
        codeImplementations: {
          java: `// Java Two Pointers: Two Sum II - Input Array Is Sorted
public class TwoPointersDemo {
    public static int[] twoSumSorted(int[] numbers, int target) {
        int left = 0;
        int right = numbers.length - 1;

        while (left < right) {
            int currentSum = numbers[left] + numbers[right];

            if (currentSum == target) {
                return new int[] { left + 1, right + 1 }; // 1-indexed output
            } else if (currentSum < target) {
                left++; // Need larger sum, move left pointer right
            } else {
                right--; // Need smaller sum, move right pointer left
            }
        }
        return new int[] {}; // No valid pair
    }

    public static void main(String[] args) {
        int[] nums = {2, 7, 11, 15};
        int target = 9;
        int[] result = twoSumSorted(nums, target);
        System.out.println("Pair 1-indexed: [" + result[0] + ", " + result[1] + "]");
    }
}`,
          cpp: `// C++ Two Pointers
#include <vector>

std::vector<int> twoSum(const std::vector<int>& numbers, int target) {
    int left = 0, right = numbers.size() - 1;
    while (left < right) {
        int sum = numbers[left] + numbers[right];
        if (sum == target) return {left + 1, right + 1};
        if (sum < target) left++;
        else right--;
    }
    return {};
}`,
          python: `# Python Two Pointers
def two_sum_sorted(numbers, target):
    left, right = 0, len(numbers) - 1
    while left < right:
        curr = numbers[left] + numbers[right]
        if curr == target:
            return [left + 1, right + 1]
        elif curr < target:
            left += 1
        else:
            right -= 1
    return []`,
          javascript: `// JavaScript Two Pointers
function twoSumSorted(numbers, target) {
  let left = 0, right = numbers.length - 1;
  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) return [left + 1, right + 1];
    if (sum < target) left++;
    else right--;
  }
  return [];
}`,
        },
        lineByLineExplanation: [
          { lineOrBlock: 'int left = 0, right = numbers.length - 1;', explanation: 'Initializes opposite direction pointers at boundaries.' },
          { lineOrBlock: 'if (currentSum < target) left++;', explanation: 'Since array is sorted, incrementing left increases the sum.' },
          { lineOrBlock: 'else right--;', explanation: 'Decrementing right decreases the sum.' },
        ],
        commonMistakes: [
          'Using two pointers on an unsorted array without sorting first.',
          'Using while(left <= right) instead of while(left < right) when pair elements must be distinct.',
        ],
        interviewQuestions: [
          { question: 'Solve 3Sum in O(N^2) using Two Pointers', company: 'Meta / Microsoft', hint: 'Sort array, fix one element, run Two Pointers on remaining subarray.' },
          { question: 'Container With Most Water', company: 'Google', hint: 'Width decreases every step, so greedily advance the shorter boundary wall.' },
        ],
        practiceProblems: [
          { title: 'Two Sum II - Input Array Is Sorted', difficulty: 'Medium', platform: 'LeetCode 167', link: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/' },
          { title: 'Container With Most Water', difficulty: 'Medium', platform: 'LeetCode 11', link: 'https://leetcode.com/problems/container-with-most-water/' },
          { title: 'Trapping Rain Water', difficulty: 'Hard', platform: 'LeetCode 42', link: 'https://leetcode.com/problems/trapping-rain-water/' },
        ],
        summary: 'Two pointers reduce O(N^2) searching to O(N) by exploiting sorted monotonicity.',
        nextSteps: ['Module 3: Sliding Window Technique for Substring Problems'],
      },
      {
        moduleId: 6,
        moduleTitle: 'Module 6: Linked Lists',
        topicId: 'reverse-linked-list',
        title: 'Linked List Reversal (Iterative and Recursive)',
        order: 1,
        difficulty: 'beginner',
        overview:
          'Reversing a singly linked list in-place by redirecting node pointers so the original head becomes the tail and the tail becomes the new head.',
        importance:
          'Core linked list building block used inside Palindrome Linked List, Reverse Nodes in k-Group, and LRU Cache.',
        prerequisites: ['Pointers and reference references in Java', 'Node struct definition'],
        conceptEnglish:
          'Maintain three pointers: prev (null initially), curr (head), and next (temp reference). In each step, capture curr.next, point curr.next backward to prev, advance prev to curr, and advance curr to next.',
        conceptHindi:
          'लिंक्ड लिस्ट को उलटने के लिए प्रत्येक नोड के नेक्स्ट (next) पॉइंटर को उसके पिछले नोड की ओर मोड़ दिया जाता है। इसके लिए prev, curr और next पॉइंटर्स का उपयोग किया जाता है।',
        syntaxAndOperations:
          'ListNode prev = null, curr = head;\nwhile (curr != null) { ListNode nxt = curr.next; curr.next = prev; prev = curr; curr = nxt; }',
        stepByStepWorking:
          '1. Store next node in temp variable.\n2. Reverse current node pointer (curr.next = prev).\n3. Advance prev to current.\n4. Advance curr to next node.',
        dryRun: {
          input: '1 -> 2 -> 3 -> NULL',
          steps: [
            { step: 1, state: 'curr=1, prev=null', explanation: '1.next becomes null; prev becomes 1, curr becomes 2' },
            { step: 2, state: 'curr=2, prev=1', explanation: '2.next points to 1; prev becomes 2, curr becomes 3' },
            { step: 3, state: 'curr=3, prev=2', explanation: '3.next points to 2; prev becomes 3, curr becomes null' },
          ],
          output: '3 -> 2 -> 1 -> NULL (new head is 3)',
        },
        complexity: {
          time: 'O(N) passes through each node exactly once',
          space: 'O(1) iterative in-place modification',
          bestCase: 'O(1) for empty or single-node list',
          worstCase: 'O(N)',
        },
        codeImplementations: {
          java: `// Java Linked List Reversal
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

public class ReverseLinkedList {
    public static ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;

        while (curr != null) {
            ListNode nextTemp = curr.next; // 1. Save next
            curr.next = prev;              // 2. Reverse pointer
            prev = curr;                   // 3. Advance prev
            curr = nextTemp;               // 4. Advance curr
        }

        return prev; // New head of reversed list
    }

    public static void main(String[] args) {
        ListNode head = new ListNode(1);
        head.next = new ListNode(2);
        head.next.next = new ListNode(3);

        ListNode reversed = reverseList(head);
        while (reversed != null) {
            System.out.print(reversed.val + (reversed.next != null ? " -> " : ""));
            reversed = reversed.next;
        }
        // Prints: 3 -> 2 -> 1
    }
}`,
          cpp: `// C++ Linked List Reversal
struct ListNode {
    int val;
    ListNode *next;
    ListNode(int x) : val(x), next(nullptr) {}
};

ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    ListNode* curr = head;
    while (curr) {
        ListNode* nxt = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nxt;
    }
    return prev;
}`,
          python: `# Python Linked List Reversal
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev`,
          javascript: `// JavaScript Linked List Reversal
function reverseList(head) {
  let prev = null, curr = head;
  while (curr) {
    const nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  return prev;
}`,
        },
        lineByLineExplanation: [
          { lineOrBlock: 'ListNode nextTemp = curr.next;', explanation: 'Crucial: captures reference to remaining list before breaking connection.' },
          { lineOrBlock: 'curr.next = prev;', explanation: 'Points current node pointer backward.' },
          { lineOrBlock: 'return prev;', explanation: 'When curr hits null, prev is at the last valid node (new head).' },
        ],
        commonMistakes: [
          'Overwriting curr.next before saving next reference, losing the rest of the list.',
          'Returning curr instead of prev after loop finishes.',
        ],
        interviewQuestions: [
          { question: 'Can you reverse a sublist between positions left and right?', company: 'Amazon', hint: 'Maintain pointer before left, reverse sublist, reconnect head and tail.' },
        ],
        practiceProblems: [
          { title: 'Reverse Linked List', difficulty: 'Easy', platform: 'LeetCode 206', link: 'https://leetcode.com/problems/reverse-linked-list/' },
          { title: 'Reverse Linked List II', difficulty: 'Medium', platform: 'LeetCode 92', link: 'https://leetcode.com/problems/reverse-linked-list-ii/' },
        ],
        summary: 'In-place linked list reversal requires 3 pointers (prev, curr, next) running in O(N) time and O(1) space.',
        nextSteps: ['Module 6: Fast and Slow Pointers (Floyd Cycle Detection)'],
      },
      {
        moduleId: 13,
        moduleTitle: 'Module 13: Dynamic Programming',
        topicId: '0-1-knapsack-problem',
        title: '0/1 Knapsack Problem (Memoization & 2D/1D Tabulation)',
        order: 1,
        difficulty: 'advanced',
        overview:
          'Given weights and values of N items, put these items in a knapsack of capacity W to achieve the maximum total value. Each item can be picked at most once (0 or 1).',
        importance:
          'The canonical classical Dynamic Programming problem that teaches state definitions, choice diagrams, overlapping subproblems, and optimal substructure.',
        prerequisites: ['Recursion and Decision Trees', 'Time complexity'],
        conceptEnglish:
          'For each item, we have 2 choices: either INCLUDE it in knapsack (if weight <= capacity) or EXCLUDE it. Max value = max(include, exclude). Overlapping subproblems are cached using a 2D table dp[i][w].',
        conceptHindi:
          '0/1 नैपसैक समस्या में प्रत्येक वस्तु के लिए केवल दो विकल्प होते हैं: या तो वस्तु को बैग में शामिल करें (1) या छोड़ दें (0)। बार-बार होने वाली गणनाओं को डायनामिक प्रोग्रामिंग टेबल में सुरक्षित किया जाता है।',
        syntaxAndOperations:
          'dp[i][w] = max(val[i-1] + dp[i-1][w - wt[i-1]], dp[i-1][w])',
        stepByStepWorking:
          '1. Define state dp[i][w]: max value using first i items with capacity w.\n2. Base condition: if i == 0 or w == 0, dp[i][w] = 0.\n3. If item weight > w: cannot include, dp[i][w] = dp[i-1][w].\n4. Else: dp[i][w] = max(val[i-1] + dp[i-1][w - wt[i-1]], dp[i-1][w]).',
        dryRun: {
          input: 'Weights = [1, 3, 4], Values = [15, 50, 70], Capacity = 4',
          steps: [
            { step: 1, state: 'Capacity 1', explanation: 'Item 1 (wt 1, val 15) fits -> max val = 15' },
            { step: 2, state: 'Capacity 3', explanation: 'Item 2 (wt 3, val 50) fits -> max val = 50' },
            { step: 3, state: 'Capacity 4', explanation: 'Pick Item 1 + Item 2: weight 1+3=4, value = 15 + 50 = 65' },
            { step: 4, state: 'Capacity 4 with Item 3', explanation: 'Pick Item 3 alone (wt 4, val 70) > 65. Max value = 70.' },
          ],
          output: 'Maximum attainable value = 70',
        },
        complexity: {
          time: 'O(N * W) where N is number of items and W is knapsack capacity',
          space: 'O(N * W) in 2D tabulation, space-optimized to O(W) using 1D array',
          bestCase: 'O(N * W)',
          worstCase: 'O(N * W)',
        },
        codeImplementations: {
          java: `// Java 0/1 Knapsack with Space Optimization to O(W)
public class KnapsackDemo {
    public static int knapSack(int capacity, int[] wt, int[] val) {
        int n = wt.length;
        // 1D DP array space-optimized
        int[] dp = new int[capacity + 1];

        for (int i = 0; i < n; i++) {
            // Traverse backward so previous row states are not overwritten
            for (int w = capacity; w >= wt[i]; w--) {
                dp[w] = Math.max(dp[w], val[i] + dp[w - wt[i]]);
            }
        }

        return dp[capacity];
    }

    public static void main(String[] args) {
        int[] values = {15, 50, 70};
        int[] weights = {1, 3, 4};
        int capacity = 4;
        System.out.println("Max Knapsack Value: " + knapSack(capacity, weights, values));
        // Output: 70
    }
}`,
          cpp: `// C++ 0/1 Knapsack
#include <vector>
#include <algorithm>

int knapSack(int capacity, const std::vector<int>& wt, const std::vector<int>& val) {
    std::vector<int> dp(capacity + 1, 0);
    for (size_t i = 0; i < wt.size(); ++i) {
        for (int w = capacity; w >= wt[i]; --w) {
            dp[w] = std::max(dp[w], val[i] + dp[w - wt[i]]);
        }
    }
    return dp[capacity];
}`,
          python: `# Python 0/1 Knapsack
def knap_sack(capacity, wt, val):
    dp = [0] * (capacity + 1)
    for i in range(len(wt)):
        for w in range(capacity, wt[i] - 1, -1):
            dp[w] = max(dp[w], val[i] + dp[w - wt[i]])
    return dp[capacity]`,
          javascript: `// JavaScript 0/1 Knapsack
function knapSack(capacity, wt, val) {
  const dp = new Array(capacity + 1).fill(0);
  for (let i = 0; i < wt.length; i++) {
    for (let w = capacity; w >= wt[i]; w--) {
      dp[w] = Math.max(dp[w], val[i] + dp[w - wt[i]]);
    }
  }
  return dp[capacity];
}`,
        },
        lineByLineExplanation: [
          { lineOrBlock: 'int[] dp = new int[capacity + 1];', explanation: 'Creates DP array storing max value for each intermediate capacity 0..W.' },
          { lineOrBlock: 'for (int w = capacity; w >= wt[i]; w--)', explanation: 'Crucial: iterating backwards ensures each item is used at most ONCE (0/1 constraint).' },
          { lineOrBlock: 'Math.max(dp[w], val[i] + dp[w - wt[i]])', explanation: 'Core Bellman optimality equation choosing max between excluding vs including current item.' },
        ],
        commonMistakes: [
          'Iterating forwards in 1D array, which solves Unbounded Knapsack (item reused infinite times) instead of 0/1.',
          'Confusing fractional greedy knapsack with discrete 0/1 dynamic programming.',
        ],
        interviewQuestions: [
          { question: 'Partition Equal Subset Sum', company: 'Google / Amazon', hint: 'Reduce to 0/1 knapsack with target capacity = Sum / 2.' },
          { question: 'Target Sum', company: 'Microsoft', hint: 'Convert +/- decisions into subset sum difference problem.' },
        ],
        practiceProblems: [
          { title: 'Partition Equal Subset Sum', difficulty: 'Medium', platform: 'LeetCode 416', link: 'https://leetcode.com/problems/partition-equal-subset-sum/' },
          { title: 'Target Sum', difficulty: 'Medium', platform: 'LeetCode 494', link: 'https://leetcode.com/problems/target-sum/' },
          { title: 'Ones and Zeroes', difficulty: 'Medium', platform: 'LeetCode 474', link: 'https://leetcode.com/problems/ones-and-zeroes/' },
        ],
        summary: '0/1 Knapsack models discrete include/exclude decisions with O(N*W) pseudo-polynomial time and O(W) space.',
        nextSteps: ['Module 13: Unbounded Knapsack & Coin Change Problems'],
      },
    ];

    for (const dsaData of sampleDsaTopics) {
      await DsaTopic.findOneAndUpdate(
        { topicId: dsaData.topicId },
        dsaData,
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Seeded ${sampleDsaTopics.length} Comprehensive DSA Curriculum Topics.`);

    console.log('\n🎉 Educational Content Seeding Complete!\n');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seeding educational content failed:', err);
    process.exit(1);
  }
};

seedContent();
