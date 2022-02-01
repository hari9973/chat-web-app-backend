const usersResolvers = require("./users");
const messagesResolvers = require("./messages");

module.exports = {
  Query: {
    ...usersResolvers.Query,
  },
  Mutation: {
    ...usersResolvers.Mutation,
    ...messagesResolvers.Mutation,
  },
  Subscription: {
    ...messagesResolvers.Subscription,
  },
};
