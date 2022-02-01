const { model, Schema } = require("mongoose");

const messagesSchema = new Schema({
  conversation: [
    {
      from: String,
      to: String,
      text: String,
      createdAt: String,
    },
  ],
});

module.exports = model("Messages", messagesSchema);
