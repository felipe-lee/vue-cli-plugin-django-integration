// Generator that creates/modifies files as needed.
const exec = require("child_process").exec;
const fs = require("fs");

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
 * Sets up a python virtual environment and activates it.
 * @param {string} pythonVersion - Major python version, i.e. 2 or 3.
 * @param {string} virtualEnv - Switch indicating if a venv should be created or already exists.
 *   Possible values: "yes", "exists", "no".
 * @param {string} venvPath - Path to where venv should be created, or to existing venv.
 * @param {string} requirementsFile - Path to requirements.txt file.
 * @returns {boolean} Indicates if venv is set up and django has been installed.
 */
function setUpVirtualEnvironment(
  pythonVersion,
  virtualEnv,
  venvPath,
  requirementsFile
) {
  if (virtualEnv === "no") {
    // Not using a venv, no point in continuing.
    return false;
  }

  let venvCommand = "";
  let venvCreated = false;

  if (virtualEnv === "yes") {
    let venvCreatorAvailable = false;

    // If we are using python 3, it has a built in virtual environment creator so we don't need to install one.
    // For python 2, we'll install/use virtualvenv.
    if (pythonVersion === "3") {
      venvCreatorAvailable = true;

      let pythonCommand = "python";

      exec(
        'python -c "import platform; print(platform.python_version())"',
        (error, stdout, stderr) => {
          // Not going to care about errors here because they'll be caught later when we try to create the venv.

          let mainPythonVersion = parseInt(stdout);

          if (mainPythonVersion !== 3) {
            pythonCommand = "python3";
          }
        }
      );

      venvCommand = `${pythonCommand} -m venv ${venvPath}`;
    } else if (pythonVersion === "2") {
      exec("pip install virtualenv", (error, stdout, stderr) => {
        if (error === null) {
          venvCreatorAvailable = true;

          venvCommand = `virtualenv ${venvPath}`;
        } else {
          console.log(
            "Unable to install virtualenv; you will have to set it up. Error: ",
            error
          );
        }

        console.log("virtualenv install stdout", stdout);

        if (stderr) {
          console.log("virtualenv install stderr", stderr);
        }
      });
    }

    if (!venvCreatorAvailable) {
      // Won't be able to create the venv, so nothing else to do.
      return false;
    }

    exec(venvCommand, (error, stdout, stderr) => {
      if (error === null) {
        venvCreated = true;
      } else {
        console.log(
          "Unable to create virtual environment; you will have set it up. Error: ",
          error
        );
        console.log("Error creating virtual environment: ", error);
      }

      console.log("venv setup stdout", stdout);

      if (stderr) {
        console.log("venv setup stderr", stderr);
      }
    });
  }

  if (!(venvCreated || virtualEnv === "exists")) {
    // Not able to use a venv so might as well escape.
    return false;
  }

  let djangoInstalled = false;
  exec(
    `source ${venvPath}/bin/activate && pip install -r ${requirementsFile}`,
    (error, stdout, stderr) => {
      if (error === null) {
        djangoInstalled = true;
      } else {
        console.log(
          "Unable to install django; you will have to set it up. Error: ",
          error
        );
      }

      console.log("req install stdout", stdout);

      if (stderr) {
        console.log("req install stderr", stderr);
      }
    }
  );

  return djangoInstalled;
}

module.exports = (
  api,
  { djangoVersion, pythonVersion, virtualEnv, venvPath },
  rootOptions
) => {
  console.log("api (generator): ", api);
  console.log("rootOptions (generator): ", rootOptions);

  api.onCreateComplete(() => {
    let requirementsFile = api.resolve("requirements.txt");

    setUpRequirementsFile(requirementsFile, djangoVersion);

    venvPath = api.resolve(venvPath);

    let djangoInstalled = setUpVirtualEnvironment(
      pythonVersion,
      virtualEnv,
      venvPath,
      requirementsFile
    );
  });
};
