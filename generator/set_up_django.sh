#!/usr/bin/env bash

# set_up_django - A script to install a python vm, install django, and create a django project.

PROGNAME=$(basename $0)

##### Functions

usage () {
  # Display usage message
  cat << __EOF__
    Usage: $PROGNAME [OPTION]
    A script to install a python vm, install django, and create a django project.

    Required:
    -n, --project-name       name of django project to create.

    Optional. All options have defaults, as indicated in the help text.
    -d, --project-directory  directory to create project in. If not input, will default to project name (django default).
    -p, --python-command     the command used to trigger the python version you want to use, e.g. python (default), py3, etc.
    -e, --virtual-env-exists switch that indicates a virtual environment already exists. If this is not included when calling this script, one will be created.
    -l, --venv-path          path to virtual environment, or path where it should be created. Defaults to "./venv/"
    -r, --requirements-file  path to requirements file, e.g. "./requirements.txt" (this is the default)
    -h, --help               display this usage help and exit
__EOF__
}

clean_up() {
  # perform program exit housekeeping
  # optionally accepts an exit status
  exit $1
}

error_exit() {
  # Display error message and exit
  echo "${PROGNAME}: ${1:-"Unknown Error"}" 1>&2
  clean_up 1
}

trap clean_up SIGHUP SIGINT SIGTERM

create_venv() {
  if [ "${python_version}" = "2" ]; then
    pip install virtualenv

    if [ "$?" != "0" ]; then
      error_exit "Unable to install virtualenv; you will have to set up the virtual environment and then rerun this script."
    fi

    python_path=$(which ${python_command})

    if [ "$?" != "0" ]; then
      error_exit "Unable to determine python path; you will have to set up the virtual environment and then rerun this script."
    fi

    virtualenv --python=${python_path} ${venv_path}
  elif [ "${python_version}" = "3" ]; then
    ${python_command} -m venv ${venv_path}
  fi

  if [ "$?" != "0" ]; then
    error_exit "Unable to create virtual environment; you will have to set it up and then rerun this script."
  fi
}

set_up_venv() {
  if [ -f ${venv_path}/Scripts/activate ]; then
    venv_activation_path=${venv_path}/Scripts/activate
  elif [ -f ${venv_path}/bin/activate ]; then
    venv_activation_path=${venv_path}/bin/activate
  else
    error_exit "Cannot find activation script for venv"
  fi

  source ${venv_activation_path}

  if [ "$?" != "0" ]; then
    error_exit "Unable to activate virtual environment; could not find activation script as expected in ${venv_path}Scripts/activate"
  fi

  pip install -r ${requirements_file}

  if [ "$?" != "0" ]; then
    error_exit "Unable to install requirements in venv. Check output, see if you can fix the error and then try again."
  fi
}

create_django_project() {
  django-admin startproject ${project_name} ${project_dir}

  if [ "$?" != "0" ]; then
    error_exit "Unable to create django project"
  fi
}

##### Input

project_name=
project_dir=
python_command="python"
create_venv=true
venv_path="./venv/"
requirements_file="./requirements.txt"

while [ "$1" != "" ]; do
  case $1 in
    -n | --project-name )           shift
                                    project_name=$1
                                    ;;
    -d | --project-directory )      shift
                                    project_dir=$1
                                    ;;
    -p | --python-command )         shift
                                    python_command=$1
                                    ;;
    -e | --virtual-env-exists )     create_venv=false
                                    ;;
    -l | --venv-path )              shift
                                    venv_path=$1
                                    ;;
    -r | --requirements-file )      shift
                                    requirements_file=$1
                                    ;;
    -h | --help )                   usage
                                    exit
                                    ;;
    * )                             usage
                                    error_exit "${1} is not a valid argument."
                                    ;;
  esac
  shift
done

if [ "${project_dir}" = "" ]; then
  project_dir=${project_name}
fi

cat << __EOF__
  These are the values we are going to use:
  project_name:               ${project_name}
  project_dir                 ${project_dir}
  python_command:             ${python_command}
  create_venv:                ${create_venv}
  venv_path:                  ${venv_path}
  requirements_file:          ${requirements_file}
__EOF__

if [ "${project_name}" = "" ]; then
  error_exit "Project name cannot be blank"
fi

python_version=$(${python_command} -c "import sys; print(sys.version_info[0])")

if [ "$?" != "0" ]; then
  error_exit "The python command input does not work."
fi

if [ ${create_venv} = false ]; then
  if [ -d ${venv_path} ]; then
    if [ ! -e ${venv_path}Scripts/activate ]; then
      error_exit "You indicated that a virtual environment exists, but the path given doesn't contain a virtual environment activation script."
    fi
  else
    error_exit "You indicated that a virtual environment exists but the path given isn't a directory."
  fi
elif [ ${create_venv} = true ] && [ -d ${venv_path} ]; then
  error_exit "You indicated that you wanted a virtual environment to be created but a directory already exists in the given path. Either remove that directory or give a new path."
fi

if [ ! -f ${requirements_file} ]; then
  error_exit "The requirements file passed in doesn't exist."
fi

##### Main

if [ ${create_venv} = true ]; then
  create_venv
fi

set_up_venv

create_django_project
