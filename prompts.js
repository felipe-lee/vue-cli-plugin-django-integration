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
    name: "pythonCommand",
    type: "input",
    message:
      "Enter the command you type to use the python interpreter you want to use for a virtual environment (e.g. python, py3, etc.):",
    default: "python"
  },
  {
    name: "createVenv",
    type: "confirm",
    message:
      "Do you want a python virtual environment to be set up (if not, it is assumed one exists)?",
    default: true
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
