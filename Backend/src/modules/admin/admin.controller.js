const Usage = require('../usage/usage.model');
const asyncHandler = require('../../utils/asyncHandler');
const mongoose = require('mongoose');

exports.getUsage = asyncHandler(async (req, res) => {
  const { userId, projectId, days } = req.query;
  const daysInt = parseInt(days) || 30;

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - daysInt);

  // dateKey format is YYYY-MM-DD
  const startKey = start.toISOString().slice(0,10);
  const endKey = end.toISOString().slice(0,10);

  const match = {};
  if (userId) match.owner = new mongoose.Types.ObjectId(userId);
  if (projectId) match.project = new mongoose.Types.ObjectId(projectId);
  match.dateKey = { $gte: startKey, $lte: endKey };

  const agg = await Usage.aggregate([
    { $match: match },
    { $group: {
        _id: null,
        aiRequestsCount: { $sum: '$aiRequestsCount' },
        embeddingsCreated: { $sum: '$embeddingsCreated' },
        promptTokens: { $sum: '$promptTokens' },
        completionTokens: { $sum: '$completionTokens' },
        totalTokens: { $sum: '$totalTokens' },
      }
    }
  ]);

  const result = agg[0] || { aiRequestsCount:0, embeddingsCreated:0, promptTokens:0, completionTokens:0, totalTokens:0 };

  res.status(200).json({ success: true, data: result });
});

exports.getRecentUsageByUser = asyncHandler(async (req, res) => {
  const { userId, days } = req.query;
  const daysInt = parseInt(days) || 30;
  if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - daysInt);
  const startKey = start.toISOString().slice(0,10);
  const endKey = end.toISOString().slice(0,10);

  const data = await Usage.find({ owner: userId, dateKey: { $gte: startKey, $lte: endKey } }).sort({ dateKey: 1 }).lean();

  res.status(200).json({ success: true, data });
});
