// Generator that creates/modifies files as needed.
const { exec, execFile, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Sets up a requirements.txt file, or modifies an existing one to include the
 * django requirement.
 * @param {string} filePath - Path to requirements.txt, including the filename
 * @param {string} djangoVersion - Major + minor django version, e.g. 1.11
 */
function setUpRequirementsFile(filePath, djangoVersion) {
  let djangoRequirement = `Django~=${djangoVersion}`;

  let content = "";
  let contentArray = [];
  let packageIndex = -1;

  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, { encoding: "utf-8" });

    contentArray = content.trim().split("\n");

    for (let i = 0; i < contentArray.length; i++) {
      if (contentArray[i].startsWith("#")) {
        continue;
      }

      let pythonPackage = contentArray[i].toLowerCase().replace(/[^a-z]/g, "");

      if (pythonPackage === "django") {
        packageIndex = i;

        break;
      }
    }
  }

  if (packageIndex > -1) {
    contentArray.splice(packageIndex, 1, djangoRequirement);
  } else {
    contentArray.push(djangoRequirement);
  }

  content = contentArray.join("\n");

  fs.writeFileSync(filePath, content, { encoding: "utf-8" });
}

/**
 * Sets up a python virtual environment (if one doesn't exist already), activates it, and installs requirements.
 * @param {string} projectName - Name of django project to create
 * @param {string} projectDir - Path to directory in which django project should be created.
 * @param {string} pythonCommand - Command used to run the version of python that should be used for the venv.
 * @param {boolean} createVenv - Boolean indicating if a venv should be created. If false, then it is assumed one exists
 * @param {string} venvPath - Path to where venv should be created, or to existing venv.
 * @param {string} requirementsFile - Path to requirements.txt file.
 * @returns {boolean} Indicates if venv is set up and django has been installed.
 */
function setUpDjango(
  projectName,
  projectDir,
  pythonCommand,
  createVenv,
  venvPath,
  requirementsFile
) {
  let djangoSetUp = false;

  let options = [
    `-n ${projectName}`,
    `-d ${projectDir}`,
    `-p ${pythonCommand}`
  ];

  if (!createVenv) {
    options.push(" -e");
  }

  options.push(`-l ${venvPath}`);
  options.push(`-r ${requirementsFile}`);

  let shPath = path.resolve(__dirname, "./set_up_django.sh");
  execFile(shPath, options, (error, stdout, stderr) => {
    if (error === null) {
      djangoSetUp = true;
    } else {
      console.log(
        "Unable to set up django; you will have to set it up. Error: ",
        error
      );
    }

    console.log("virtualenv install stdout", stdout);

    if (stderr) {
      console.log("virtualenv install stderr", stderr);
    }
  });
}

module.exports = (
  api,
  { djangoVersion, pythonCommand, createVenv, venvPath },
  rootOptions
) => {
  console.log("api (generator): ", api);
  console.log("rootOptions (generator): ", rootOptions);

  api.onCreateComplete(() => {
    let requirementsFile = api.resolve("requirements.txt");

    setUpRequirementsFile(requirementsFile, djangoVersion);

    venvPath = api.resolve(venvPath);

    let djangoSetUp = setUpDjango(
      rootOptions.projectName,
      ".",
      pythonCommand,
      createVenv,
      venvPath,
      requirementsFile
    );
  });
};
