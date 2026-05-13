import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    pool: "threads",
    maxWorkers: 1,
    hookTimeout: 120000,
  },
});
