const DsaTopic = require('../models/DsaTopic');
const TopicProgress = require('../models/TopicProgress');

// Standard 14 Modules Roadmap Definition
const DSA_MODULES = [
  { id: 1, title: 'Programming Foundations', description: 'Variables, loops, arrays, functions, and algorithmic thinking' },
  { id: 2, title: 'Time and Space Complexity', description: 'Big O notation, amortized analysis, best/worst case evaluations' },
  { id: 3, title: 'Arrays and Strings', description: 'Two pointers, sliding window, prefix sums, in-place manipulation' },
  { id: 4, title: 'Recursion and Backtracking', description: 'Recursion trees, base conditions, permutations, combination subsets' },
  { id: 5, title: 'Searching and Sorting', description: 'Binary search variants, merge sort, quick sort, custom comparators' },
  { id: 6, title: 'Linked Lists', description: 'Singly, doubly, circular lists, reversal, fast-slow pointer cycle detection' },
  { id: 7, title: 'Stack and Queue', description: 'Monotonic stacks, circular queues, deque, parenthesis evaluation' },
  { id: 8, title: 'Hashing & HashMaps', description: 'Hash collision resolution, frequency tables, prefix hash patterns' },
  { id: 9, title: 'Trees and Binary Trees', description: 'BFS/DFS traversals, BST validation, LCA, tree construction' },
  { id: 10, title: 'Heaps and Priority Queues', description: 'Min/Max heap, top-K frequent elements, heapify, k-way merges' },
  { id: 11, title: 'Graphs and Traversal', description: 'Adjacency list, BFS, DFS, Dijkstra, Kahn algorithm, topological sort' },
  { id: 12, title: 'Greedy Algorithms', description: 'Interval scheduling, fractional knapsack, Huffman coding, local optima' },
  { id: 13, title: 'Dynamic Programming', description: '1D/2D memoization vs tabulation, knapsack, LCS, LIS, state transitions' },
  { id: 14, title: 'Advanced Problem Solving', description: 'Bit manipulation, Tries, Disjoint Set Union (DSU), Segment Trees' },
];

// @GET /api/dsa/modules
exports.getModules = async (req, res, next) => {
  try {
    const topicCounts = await DsaTopic.aggregate([
      { $group: { _id: '$moduleId', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    topicCounts.forEach((tc) => {
      countMap[tc._id] = tc.count;
    });

    let userCompletedMap = {};
    if (req.user) {
      const userProgress = await TopicProgress.find({
        user: req.user.id,
        type: 'dsa',
        completed: true,
      });

      // Map progress to module
      const completedTopicIds = userProgress.map((p) => p.topicId);
      const completedTopics = await DsaTopic.find({ topicId: { $in: completedTopicIds } }).select('moduleId topicId');
      completedTopics.forEach((t) => {
        userCompletedMap[t.moduleId] = (userCompletedMap[t.moduleId] || 0) + 1;
      });
    }

    const modules = DSA_MODULES.map((m) => {
      const totalTopics = countMap[m.id] || 0;
      const completedCount = userCompletedMap[m.id] || 0;
      const progressPercent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;
      return {
        ...m,
        totalTopics,
        completedCount,
        progressPercent,
      };
    });

    res.status(200).json({ success: true, modules });
  } catch (error) {
    next(error);
  }
};

// @GET /api/dsa/topics
exports.getTopics = async (req, res, next) => {
  try {
    const { moduleId, difficulty, search } = req.query;
    const query = {};

    if (moduleId) query.moduleId = Number(moduleId);
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { overview: new RegExp(search, 'i') },
      ];
    }

    const topics = await DsaTopic.find(query)
      .select('moduleId moduleTitle topicId title order difficulty overview complexity')
      .sort('moduleId order');

    let userProgress = {};
    if (req.user) {
      const progressDocs = await TopicProgress.find({
        user: req.user.id,
        type: 'dsa',
      });
      progressDocs.forEach((p) => {
        userProgress[p.topicId] = { completed: p.completed, bookmarked: p.bookmarked };
      });
    }

    res.status(200).json({ success: true, total: topics.length, topics, userProgress });
  } catch (error) {
    next(error);
  }
};

// @GET /api/dsa/topics/:topicId
exports.getTopicDetail = async (req, res, next) => {
  try {
    const topic = await DsaTopic.findOne({ topicId: req.params.topicId });
    if (!topic) return res.status(404).json({ success: false, message: 'DSA Topic not found.' });

    let progress = { completed: false, bookmarked: false };
    if (req.user) {
      const p = await TopicProgress.findOne({
        user: req.user.id,
        type: 'dsa',
        topicId: topic.topicId,
      });
      if (p) progress = { completed: p.completed, bookmarked: p.bookmarked };
    }

    // Sibling topics in same module
    const siblingTopics = await DsaTopic.find({ moduleId: topic.moduleId })
      .select('topicId title order difficulty')
      .sort('order');

    res.status(200).json({ success: true, topic, progress, siblingTopics });
  } catch (error) {
    next(error);
  }
};

// @POST /api/dsa/topics/:topicId/progress
exports.updateTopicProgress = async (req, res, next) => {
  try {
    const { completed, bookmarked } = req.body;
    const { topicId } = req.params;

    const topic = await DsaTopic.findOne({ topicId });
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found.' });

    const update = { lastStudiedAt: new Date() };
    if (completed !== undefined) {
      update.completed = completed;
      if (completed) update.completedAt = new Date();
    }
    if (bookmarked !== undefined) update.bookmarked = bookmarked;

    const p = await TopicProgress.findOneAndUpdate(
      { user: req.user.id, type: 'dsa', topicId },
      update,
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, progress: p });
  } catch (error) {
    next(error);
  }
};

