const Job = require("../models/Job");
const User = require("../models/User");
const faker = require("@faker-js/faker").fakerEN_US;
const FactoryBot = require("factory-bot");
require("dotenv").config();

const testUserPassword = "Password123!";

const factory = FactoryBot.factory;
const factoryAdapter = new FactoryBot.MongooseAdapter();
factory.setAdapter(factoryAdapter);

factory.define("job", Job, {
  company: () => faker.company.name(),
  position: () => faker.person.jobTitle(),
  status: () =>
    ["applied", "interview", "offer", "rejected"][
      Math.floor(4 * Math.random())
    ],
});

factory.define("user", User, {
  name: () => faker.person.fullName(),
  email: () => faker.internet.email(),
  password: () => testUserPassword,
});

const seed_db = async () => {
  let testUser = null;
  try {
    await Job.deleteMany({});
    await User.deleteMany({});

    testUser = await factory.create("user", {
      password: testUserPassword,
    });

    await factory.createMany("job", 20, { createdBy: testUser._id });
  } catch (e) {
    console.log("database error");
    console.log(e.message);
    throw e;
  }
  return testUser;
};

module.exports = { testUserPassword, factory, seed_db };
