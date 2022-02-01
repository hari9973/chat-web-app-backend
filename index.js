const { ApolloServer } = require("apollo-server-express");
const { AuthenticationError } = require("apollo-server-express");
const { createServer } = require("http");
const express = require("express");
const { execute, subscribe } = require("graphql");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");
const User = require("./models/User");

const app = express();

const PORT = process.env.port || 4000;

const httpServer = createServer(app);

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const subscriptionServer = SubscriptionServer.create(
  {
    schema,
    execute,
    subscribe,
    async onConnect(connectionParams) {
      const authHeader = connectionParams.Authorization;
      if (authHeader) {
        const token = authHeader.split("Bearer ")[1];
        if (token) {
          try {
            const user = jwt.verify(token, process.env.SECRET_KEY);
            const currentUser = await User.findOne({ username: user.username });
            if (currentUser == null) {
              throw new AuthenticationError("User does not exists");
            }
            return currentUser;
          } catch (err) {
            throw new AuthenticationError("Invalid/Expired token");
          }
        }
        throw new Error("Authentication token must be 'Bearer [token]");
      }
      throw new Error("Authorization header must be provided");
    },
  },
  { server: httpServer, path: "/graphql" }
);

const server = new ApolloServer({
  schema,
  context: ({ req }) => ({ req }),
  plugins: [
    {
      async serverWillStart() {
        return {
          async drainServer() {
            subscriptionServer.close();
          },
        };
      },
    },
  ],
});

/*const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ req, pubsub }),
});*/

mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true })
  .then(async () => {
    console.log("MongoDB Connected");
    await server.start();
    server.applyMiddleware({ app });
    httpServer.listen(PORT, () =>
      console.log(`Server is now running on http://localhost:${PORT}/graphql`)
    );
  })
  .catch((err) => {
    console.error(err);
  });
