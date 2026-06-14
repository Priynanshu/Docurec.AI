const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// Citizen Model
// A "Citizen" is a person whose documents a CSC operator manages.
// One User (the operator) can have MANY citizens.
// Each Document can optionally belong to one Citizen (citizenId field).
//
// This does NOT break existing functionality:
// - Documents without a citizenId still belong directly to the operator
//   (treated as "My Documents" / the operator's own documents)
// - Documents with a citizenId are grouped under that citizen's profile
// ─────────────────────────────────────────────────────────────────────────────

const citizenSchema = new mongoose.Schema(
  {
    // The CSC operator who created/manages this citizen profile
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Basic identity info
    name: {
      type: String,
      required: [true, 'Citizen name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9+\-\s]{0,15}$/, 'Invalid phone number'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    village: { type: String, trim: true },
    district: { type: String, trim: true },
    state: { type: String, trim: true },

    // Quick reference photo (optional) — stored via ImageKit like documents
    avatarUrl: { type: String, default: null },

    // Free-form notes the operator can add
    notes: { type: String, trim: true, maxlength: 500 },

    // Cached counts — updated whenever documents are added/removed
    documentCount: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Text search across citizen name/village/district — helps operators find
// a citizen quickly among hundreds
citizenSchema.index({ name: 'text', village: 'text', district: 'text', phone: 'text' });
citizenSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Citizen', citizenSchema);
