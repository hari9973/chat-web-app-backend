const { model, Schema } = require("mongoose");
const Messages = require("./Messages");

const userSchema = new Schema({
  username: String,
  password: String,
  email: String,
  createdAt: String,
  conversations: [
    {
      conversationWith: [String],
      chatMesseges: { type: Schema.Types.ObjectId, ref: Messages },
    },
  ],
});

module.exports = model("User", userSchema);
