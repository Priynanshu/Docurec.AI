const { param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

// Run all validators and collect errors — call this after the rule arrays
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    throw new ValidationError('Validation failed', formatted);
  }
  next();
};

// For routes with :id param (document ID must be a valid MongoDB ObjectId)
const documentIdRule = [
  param('id').isMongoId().withMessage('Invalid document ID'),
];

// For paginated list routes
const paginationRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

module.exports = { validate, documentIdRule, paginationRules };
