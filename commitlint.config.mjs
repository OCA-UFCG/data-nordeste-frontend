/** @type {import("@commitlint/types").UserConfig} */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // The team documents these seven types in CONTRIBUTING.md. Keep both lists
    // in sync: this rule is the gate, that file is the explanation.
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "refactor", "test", "docs", "chore", "revert"],
    ],

    // INTENTIONAL: subjects are written in Portuguese, where capitalization
    // carries no meaning. Rejecting "fix: Corrige acordeon" would only add
    // friction at the gate without making the history any more readable.
    "subject-case": [0],
  },
};

export default config;
