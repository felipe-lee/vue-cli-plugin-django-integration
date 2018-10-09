// Prompts for user when invoking to add plugin to project.
const path = require("path");

module.exports = [
  {
    name: "djangoVersion",
    type: "list",
    message: "Pick the version of Django you want to use:",
    default: "1.11",
    choices: [
      {
        name: "1.11 (LTS)",
        value: "1.11",
        short: "1.11"
      },
      {
        name: "2.0",
        value: "2.0",
        short: "2.0"
      },
      {
        name: "2.1",
        value: "2.1",
        short: "2.1"
      }
    ]
  },
  {
    name: "pythonVersion",
    type: "list",
    message:
      "Pick the version of Python you are going to use (it needs to already be installed):",
    default: "3",
    choices: [
      {
        name: "3",
        value: "3",
        short: "3"
      },
      {
        name: "2",
        value: "2",
        short: "2"
      }
    ]
  },
  {
    name: "virtualEnv",
    type: "list",
    message:
      "Do you want a python virtual environment to be set up or does one already exist?",
    default: "yes",
    choices: [
      {
        name: "Yes.",
        value: "yes",
        short: "yes"
      },
      {
        name: "No, the project already has one.",
        value: "exists",
        short: "exists"
      },
      {
        name: "No, the project doesn't need a virtual environment.",
        value: "no",
        short: "no"
      }
    ]
  },
  {
    name: "venvPath",
    type: "input",
    message: "Virtual environment location (relative to project root):",
    default: "venv/",
    filter(input) {
      input = path.normalize(input).replace(/\\/g, "/");
      if (input.slice(-1) !== "/") input += "/";
      return input;
    }
  }
];
