const mongoose = require("mongoose");
const Project = require("./project.model");

exports.create = (data) => Project.create(data);

exports.findMany = (query, options = {}) => {
  const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
  return Project.find(query).skip(skip).limit(limit).sort(sort).lean();
};

exports.count = (query) => Project.countDocuments(query);

exports.findOneLean = (query, select) => {
  const q = Project.findOne(query);
  if (select) q.select(select);
  return q.lean();
};

exports.findOne = (query) => Project.findOne(query);

exports.findOneAndUpdate = (query, data) =>
  Project.findOneAndUpdate(query, data, { new: true });

exports.countNotesByUser = (userId) =>
  mongoose.model("Note").countDocuments({
    owner: userId,
    isDeleted: false,
  });

exports.aggregateNoteStatsByProject = (projectId, userId, oneWeekAgo) =>
  mongoose.model("Note").aggregate([
    {
      $match: {
        project: new mongoose.Types.ObjectId(projectId),
        owner: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        totalNotes: { $sum: 1 },
        notesThisWeek: {
          $sum: {
            $cond: [{ $gte: ["$createdAt", oneWeekAgo] }, 1, 0],
          },
        },
      },
    },
  ]);
