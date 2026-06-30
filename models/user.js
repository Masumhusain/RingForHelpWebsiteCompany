const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose').default;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },

   phone: {
        type: String,  // ✅ String is better for phone numbers (leading zeros, formatting)
        required: [true, 'Phone number is required'],
        unique: true,  // ✅ Phone should also be unique
        trim: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
        validate: {
            validator: function(v) {
                return /^[0-9]{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid 10-digit phone number!`
        }
    },
    role: {
        type: String,
        enum: ['customer', 'user', 'provider', 'admin'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ✅ Plugin with usernameField
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
module.exports = mongoose.model('User', userSchema);