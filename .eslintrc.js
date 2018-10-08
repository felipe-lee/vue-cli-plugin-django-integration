module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true
  },
  parser: "babel-eslint",
  plugins: ["prettier"],
  extends: ["plugin:prettier/recommended"]
};
