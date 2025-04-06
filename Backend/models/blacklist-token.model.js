const mongoose = require('mongoose');

const blacklistTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // Automatically delete documents after 24 hours
    }
});

const blacklistTokenModel = mongoose.model('blacklist-token', blacklistTokenSchema);

module.exports = blacklistTokenModel;
