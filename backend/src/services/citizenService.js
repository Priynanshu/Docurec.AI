// ─────────────────────────────────────────────────────────────────────────────
// Citizen Service
// Handles all business logic for CSC operators managing multiple citizens.
//
// A "Citizen" belongs to one operator (userId). Documents can be linked to
// a citizen via Document.citizenId. This lets one operator account organize
// documents for many people — exactly what real CSC centres need.
// ─────────────────────────────────────────────────────────────────────────────

const Citizen = require('../models/Citizen');
const Document = require('../models/Document');
const ApiError = require('../utils/ApiError');
const { cacheGet, cacheSet, cacheDel, cacheDelPattern } = require('../config/redis');

// ── Create a new citizen profile ──────────────────────────────────────────────
const createCitizen = async (userId, data) => {
  const { name, phone, email, village, district, state, notes } = data;

  const citizen = await Citizen.create({
    userId,
    name,
    phone,
    email,
    village,
    district,
    state,
    notes,
  });

  await cacheDelPattern(`citizens:${userId}:*`);
  return citizen;
};

// ── List all citizens for an operator (with search + pagination) ─────────────
const getUserCitizens = async (userId, options = {}) => {
  const { page = 1, limit = 20, search, sort = '-createdAt' } = options;

  const cacheKey = `citizens:${userId}:${JSON.stringify(options)}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const query = { userId, isDeleted: false };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { village: { $regex: search, $options: 'i' } },
      { district: { $regex: search, $options: 'i' } },
    ];
  }

  const [citizens, total] = await Promise.all([
    Citizen.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit)),
    Citizen.countDocuments(query),
  ]);

  const result = { citizens, total, page: parseInt(page), limit: parseInt(limit) };
  await cacheSet(cacheKey, result, 120); // short cache - 2 min, since counts change often
  return result;
};

// ── Get a single citizen (with auth check) ────────────────────────────────────
const getCitizenById = async (citizenId, userId) => {
  const citizen = await Citizen.findOne({ _id: citizenId, userId, isDeleted: false });
  if (!citizen) throw new ApiError(404, 'Citizen not found');
  return citizen;
};

// ── Update a citizen's profile ────────────────────────────────────────────────
const updateCitizen = async (citizenId, userId, data) => {
  const citizen = await Citizen.findOne({ _id: citizenId, userId, isDeleted: false });
  if (!citizen) throw new ApiError(404, 'Citizen not found');

  const allowedFields = ['name', 'phone', 'email', 'village', 'district', 'state', 'notes'];
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) citizen[field] = data[field];
  });

  await citizen.save();
  await cacheDelPattern(`citizens:${userId}:*`);
  return citizen;
};

// ── Soft-delete a citizen ──────────────────────────────────────────────────────
// Note: documents belonging to this citizen are NOT deleted — they just
// become "unassigned" (citizenId stays but citizen is marked deleted).
// This protects against accidental data loss of important documents.
const deleteCitizen = async (citizenId, userId) => {
  const citizen = await Citizen.findOne({ _id: citizenId, userId, isDeleted: false });
  if (!citizen) throw new ApiError(404, 'Citizen not found');

  citizen.isDeleted = true;
  citizen.deletedAt = new Date();
  await citizen.save();

  await cacheDelPattern(`citizens:${userId}:*`);
};

// ── Get all documents belonging to a specific citizen ─────────────────────────
const getCitizenDocuments = async (citizenId, userId, options = {}) => {
  const { page = 1, limit = 12, status, type, sort = '-createdAt' } = options;

  // Verify the citizen belongs to this operator first
  const citizen = await Citizen.findOne({ _id: citizenId, userId, isDeleted: false });
  if (!citizen) throw new ApiError(404, 'Citizen not found');

  const query = { citizenId, userId, isDeleted: false };
  if (status) query.status = status;
  if (type) query.documentType = type;

  const [docs, total] = await Promise.all([
    Document.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-rawOcrText -structuredContent'),
    Document.countDocuments(query),
  ]);

  return { citizen, docs, total, page: parseInt(page), limit: parseInt(limit) };
};

// ── Refresh the cached documentCount for a citizen ─────────────────────────────
// Called after a document is uploaded to / deleted from a citizen's folder
const refreshCitizenDocumentCount = async (citizenId) => {
  if (!citizenId) return;
  const count = await Document.countDocuments({ citizenId, isDeleted: false });
  await Citizen.findByIdAndUpdate(citizenId, { documentCount: count });
};

module.exports = {
  createCitizen,
  getUserCitizens,
  getCitizenById,
  updateCitizen,
  deleteCitizen,
  getCitizenDocuments,
  refreshCitizenDocumentCount,
};
