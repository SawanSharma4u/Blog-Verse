const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");

const userSchema = new mongoose.Schema({
    FName: {
        type: String,
        required: true
    },
    LName: String,
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    googleID: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
module.exports = new mongoose.model("User", userSchema);
