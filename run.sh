#!/bin/sh
#
# Script for running the main program.
# Author: Alex TSANG <alextsang@live.com>
# License: BSD-3-Clause

set -u
IFS='\n\t'

baseDirectory="$(cd "$(dirname "${0}")"; pwd)"

cd "${baseDirectory}"
node index.js
