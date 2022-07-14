const mongoose = require("mongoose");
const date = new Date();
const day = date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear();
const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    postedAt: {
        type: String,
        default: day.toString()
    }
});

module.exports = new mongoose.model("Post", blogSchema);