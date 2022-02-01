const { AuthenticationError } = require("apollo-server-express");
const { PubSub } = require("graphql-subscriptions");
const { withFilter } = require("graphql-subscriptions");

const checkAuth = require("../../utils/check-auth");
const User = require("../../models/User");
const Messages = require("../../models/Messages");

const pubsub = new PubSub();

const findUserAndIdInConversations = (items, username) => {
  let found = false;
  let conversationId = 0;
  if (items.length <= 0) {
    return { found, conversationId };
  }
  items.forEach((key) => {
    key.conversationWith.forEach((val) => {
      if (val === username) {
        found = true;
        conversationId = key.chatMesseges._id.toString();
      }
    });
  });
  return { found, conversationId };
};

module.exports = {
  Mutation: {
    newMessage: async (_, { message: { from, to, text } }, context) => {
      const user = checkAuth(context);

      if (user.username !== from) {
        throw new AuthenticationError(
          "authanticated user and the from address does not match"
        );
      }

      const rec = await User.findOne({ username: to });

      if (rec == null) {
        throw new AuthenticationError("Receiver user does not exists");
      }

      const me = await User.findOne({ username: user.username });

      const search = findUserAndIdInConversations(me.conversations, to);

      if (!search.found) {
        const receiver = await User.findOne({ username: to });

        const newMsg = new Messages({
          conversation: [
            { from, to, text, createdAt: new Date().toISOString() },
          ],
        });

        me.conversations.push({
          conversationWith: [to],
          chatMesseges: newMsg,
        });

        receiver.conversations.push({
          conversationWith: [from],
          chatMesseges: newMsg,
        });

        await newMsg.save();
        await me.save();
        await receiver.save();
      } else {
        const chat = await Messages.findById(search.conversationId);
        const msg = { from, to, text, createdAt: new Date().toISOString() };
        var subDoc = chat["conversation"].create(msg);
        chat["conversation"].push(subDoc);
        const result = await chat.save();
        pubsub.publish("NEW_MESSAGE", {
          newMessage: {
            id: result._id,
            conversation: { id: subDoc._id, ...msg },
          },
        });
      }
      return {
        messageDelivered: true,
      };
    },
  },
  Subscription: {
    newMessage: {
      subscribe: withFilter(
        () => pubsub.asyncIterator("NEW_MESSAGE"),
        (payload, _, context) => {
          return payload.newMessage.conversation.to === context.username;
        }
      ),
    },
  },
};
