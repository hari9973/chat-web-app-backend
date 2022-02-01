const { gql } = require("apollo-server-express");

module.exports = gql`
  type User {
    id: ID!
    email: String!
    token: String!
    username: String!
    conversations: [ConversationWith]
  }
  type ConversationWith {
    id: ID!
    conversationWith: [String]
    chatMessagesId: ID!
    conversationType: String!
  }
  type singleMessage {
    id: ID!
    from: String!
    to: String!
    text: String!
    createdAt: String!
  }
  type Message {
    id: ID!
    conversation: singleMessage!
  }
  input RegisterInput {
    username: String!
    password: String!
    confirmPassword: String!
    email: String!
  }
  type SearchResult {
    username: String!
    exists: Boolean!
  }
  type ack {
    messageDelivered: Boolean!
    errorMsg: String
  }
  input MessageInput {
    from: String!
    to: String!
    text: String!
  }
  type Query {
    getUsers: [User]
    me: User
    searchUser(username: String!): SearchResult
  }
  type Mutation {
    register(registerInput: RegisterInput): User!
    login(username: String!, password: String!): User!
    newMessage(message: MessageInput): ack!
  }
  type Subscription {
    newMessage: Message!
    newConversation(userId: ID!): ConversationWith!
  }
`;
