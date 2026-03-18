const { app } = require("../app");
const get_chai = require("../utils/get_chai");
const User = require("../models/User");

describe("tests for registration", function () {
  it("should get the registration page", async function () {
    const { expect, request } = await get_chai();

    const res = await request.execute(app).get("/sessions/register").send();

    expect(res).to.have.status(200);
    expect(res.text).to.be.a("string");

    const textNoLineEnd = res.text.replaceAll("\n", "");
    const csrfMatch = /name="_csrf"\s+value="(.*?)"/.exec(textNoLineEnd);

    expect(csrfMatch).to.not.be.null;
    this.csrfToken = csrfMatch[1];

    const cookies = res.headers["set-cookie"] || [];
    expect(cookies.length).to.be.greaterThan(0);

    this.cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ");
    expect(this.cookieHeader).to.be.a("string");
  });

  it.skip("should register a new user", async function () {
    this.timeout(10000);

    const { expect, request } = await get_chai();

    const email = `test${Date.now()}@example.com`;

    const dataToPost = {
      name: "Test User",
      email,
      password: "Password123!",
      password1: "Password123!",
      _csrf: this.csrfToken,
    };

    const res = await request
      .execute(app)
      .post("/sessions/register")
      .set("Cookie", this.cookieHeader)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0)
      .send(dataToPost);

    expect(res).to.have.status(302);

    const newUser = await User.findOne({ email });
    expect(newUser).to.not.be.null;
  });
});
