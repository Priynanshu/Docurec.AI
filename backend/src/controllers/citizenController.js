const {
  createCitizen,
  getUserCitizens,
  getCitizenById,
  updateCitizen,
  deleteCitizen,
  getCitizenDocuments,
} = require('../services/citizenService');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const ApiError = require('../utils/ApiError');

// POST /api/v1/citizens
const create = async (req, res, next) => {
  try {
    const { name, phone, email, village, district, state, notes } = req.body;
    if (!name || !name.trim()) throw new ApiError(400, 'Citizen name is required');

    const citizen = await createCitizen(req.user._id, {
      name, phone, email, village, district, state, notes,
    });

    return sendCreated(res, { citizen }, 'Citizen added successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/citizens
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, sort } = req.query;
    const result = await getUserCitizens(req.user._id, {
      page: parseInt(page), limit: parseInt(limit), search, sort,
    });
    return sendPaginated(res, result.citizens, result.total, page, limit);
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/citizens/:id
const getOne = async (req, res, next) => {
  try {
    const citizen = await getCitizenById(req.params.id, req.user._id);
    return sendSuccess(res, { citizen });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/citizens/:id
const update = async (req, res, next) => {
  try {
    const citizen = await updateCitizen(req.params.id, req.user._id, req.body);
    return sendSuccess(res, { citizen }, 'Citizen updated');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/citizens/:id
const remove = async (req, res, next) => {
  try {
    await deleteCitizen(req.params.id, req.user._id);
    return sendSuccess(res, {}, 'Citizen removed');
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/citizens/:id/documents
const getDocuments = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, status, type, sort } = req.query;
    const result = await getCitizenDocuments(req.params.id, req.user._id, {
      page: parseInt(page), limit: parseInt(limit), status, type, sort,
    });
    return res.json({
      success: true,
      message: 'Success',
      data: result.docs,
      citizen: result.citizen,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getOne, update, remove, getDocuments };
