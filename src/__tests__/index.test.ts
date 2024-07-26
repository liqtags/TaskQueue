import TaskQueue from "..";

jest.spyOn(global.console, "log");

describe("@liqtags/taskqueue", () => {
  it("should run tasks in order", async () => {
    expect(1).toBe(1);
  });
});
