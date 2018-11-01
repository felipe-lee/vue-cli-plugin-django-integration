// Generator that creates/modifies files as needed.
const { execSync } = require("child_process");
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
        // Ignore comment lines
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
 * Determines the version of python that is going to be used.
 * @param {string} pythonCommand - Command used to run the version of python that should be used for the venv.
 * @returns {number} Indicates python version. If 0, there was an error.
 */
function determinePythonVersion(pythonCommand) {
  console.log("determining python version");

  let invalidVersion = -1; // random invalid version
  let pythonVersion = invalidVersion; // if we succeed, it will be replaced.

  try {
    pythonVersion = execSync(
      `${pythonCommand} -c "import sys; print(sys.version_info[0])"`
    );
  } catch (error) {
    console.log(
      `Unable to determine python version; you will have set it up your own environment. Error: ${
        error.message
      }`
    );

    console.log(`python version determination stdout: ${error.stdout}`);
    console.log(`python version determination stderr: ${error.stderr}`);

    return invalidVersion;
  }

  console.log(`python version: ${pythonVersion}`);

  return parseInt(pythonVersion);
}

/**
 * Installs virtualenv which is used to create a python venv in python 2.
 * @returns {boolean} Indicates if virtualenv was installed.
 */
function installVirtualenv() {
  console.log("installing virtualenv for python 2");

  try {
    execSync("pip install virtualenv");
  } catch (error) {
    console.log(
      `Unable to install virtualenv; you will have to set it up. Error: ${
        error.message
      }`
    );

    console.log(`virtualenv install stdout: ${error.stdout}`);
    console.log(`virtualenv install stderr: ${error.stderr}`);

    return false;
  }

  return true;
}

/**
 * Creates a python virtual environment.
 * @param {string} pythonCommand - Command used to run the version of python that should be used for the venv.
 * @param {string} venvPath - Path to where venv should be created, or to existing venv.
 * @returns {boolean} Indicates if a venv was created.
 */
function createVirtualEnvironment(pythonCommand, venvPath) {
  console.log("creating virtual environment");

  let pythonVersion = determinePythonVersion(pythonCommand);

  let venvCommand = "";

  switch (pythonVersion) {
    case 2:
      let virtualenvInstalled = installVirtualenv();

      if (virtualenvInstalled === false) {
        // Can't proceed without virtualenv.
        return false;
      }

      venvCommand = `virtualenv ${venvPath}`;
      break;
    case 3:
      venvCommand = `${pythonCommand} -m venv ${venvPath}`;
      break;
    default:
      // There was an error determining python version. Next steps can't be completed as easily, if at all.
      return false;
  }

  console.log(`attempting to create venv, here: ${venvPath}`);

  try {
    execSync(venvCommand);
  } catch (error) {
    console.log(
      `Unable to create virtual environment; you will have set it up. Error: ${
        error.message
      }`
    );

    console.log(`venv setup stdout: ${error.stdout}`);
    console.log(`venv setup stderr: ${error.stderr}`);

    return false;
  }

  console.log("no error setting up venv");
  return true;
}

/**
 * Determines the command to use to activate the venv. This can vary based on OS.
 * @param {string} venvPath - Path to venv.
 * @return {string} Command to activate venv.
 */
function determineActivationScriptCommand(venvPath) {
  console.log("determining command to activate venv");

  let activatePath = path.resolve(venvPath, "./bin/activate");

  if (fs.existsSync(activatePath)) {
    return `source ${activatePath}`;
  }

  activatePath = path.resolve(venvPath, "./Scripts/activate");

  if (fs.existsSync(activatePath)) {
    return activatePath;
  }
}

/**
 * Installs requirements for project.
 * @param {string} venvActivationCommand - Command to activate venv.
 * @param {string} requirementsFile - Path to requirements.txt file.
 * @returns {boolean} Indicates if venv is set up and django has been installed.
 */
function installRequirements(venvActivationCommand, requirementsFile) {
  console.log("installing requirements in venv.");

  try {
    execSync(`${venvActivationCommand} && pip install -r ${requirementsFile}`);
  } catch (error) {
    console.log(
      `Unable to install django; you will have to set it up. Error:  ${
        error.message
      }`
    );

    console.log(`req install stdout: ${error.stdout}`);
    console.log(`req install stderr: ${error.stderr}`);

    return false;
  }

  return true;
}

/**
 * Creates a django project
 * @param {string} venvActivationCommand - Command to activate venv.
 * @param {string} projectName - Name of project to create (should probably match overall project name).
 * @param {string} projectPath - Path to project.
 * @returns {boolean} Indicates if django project was created.
 */
function createDjangoProject(venvActivationCommand, projectName, projectPath) {
  console.log("creating django project");

  try {
    execSync(
      `${venvActivationCommand} && django-admin startproject ${projectName} ${projectPath}`
    );
  } catch (error) {
    console.log(`Unable to create Django project. Error: ${error.message}`);
    console.log(`django create stdout: ${error.stdout}`);
    console.log(`django create stderr: ${error.stderr}`);

    return false;
  }

  return true;
}

module.exports = (
  api,
  { djangoVersion, pythonCommand, createVenv, venvPath },
  rootOptions
) => {
  // console.log("api (generator): ", api);
  // console.log("rootOptions (generator): ", rootOptions);
  console.log("starting generator");

  api.onCreateComplete(() => {
    let requirementsFile = api.resolve("requirements.txt");

    console.log("setting up requirements file");
    setUpRequirementsFile(requirementsFile, djangoVersion);

    venvPath = api.resolve(venvPath);

    if (createVenv === true) {
      console.log("creating up venv");

      let venvCreated = createVirtualEnvironment(pythonCommand, venvPath);

      if (venvCreated === false) {
        // Can't continue without venv.
        return;
      }
    }

    console.log("determining venv activation script");
    let venvActivationCommand = determineActivationScriptCommand(venvPath);

    if (venvActivationCommand === "") {
      // Don't know how to activate venv.
      return;
    }

    console.log("installing reqs");
    let requirementsInstalled = installRequirements(
      venvActivationCommand,
      requirementsFile
    );

    if (requirementsInstalled === false) {
      // Can't do anything if django isn't installed.
      return;
    }

    console.log("creating django project");
    let djangoProjectCreated = createDjangoProject(
      venvActivationCommand,
      rootOptions.projectName,
      api.generator.context
    );
  });
};
