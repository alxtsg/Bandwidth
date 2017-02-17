/**
 * Main program.
 *
 * @author Alex Tsang <alextsang@live.com>
 *
 * @license BSD-3-Clause
 */

'use strict';

const Buffer = require('buffer').Buffer;
const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
const util = require('util');

// Pattern of netstat output to be captured (number of in/ out bytes).
const OUTPUT_PATTERN = /(\d+)\s+(\d+)$/;

// Path to configuration file.
const CONFIG_FILE_PATH = path.join(
  __dirname,
  'config.json'
);

// Path to error log.
const ERROR_FILE_PATH = path.join(
  __dirname,
  'error.log'
);

// Path to output CSV file.
const OUTPUT_FILE_PATH = path.join(
  __dirname,
  'bandwidth.csv'
);

// Interface name.
let networkInterface = null;

// Captured output from netstat.
let output = '';

/**
 * Gets date string in the format of YYYY-MM-DD.
 *
 * @returns {string} Date string.
 */
const getDateString = function getDateString() {
  const date = new Date();
  let dateString = date.toISOString();
  dateString = dateString.split('T')[0];
  return dateString;
};

/**
 * Logs error message.
 *
 * @param {string} message Error message.
 */
const logError = function logError(message) {
  fs.appendFile(
    ERROR_FILE_PATH,
    util.format(
      '%s\n',
      message
    ),
    (appendFileError) => {
      if (appendFileError !== null) {
        throw appendFileError;
      }
    }
  );
};

/**
 * Parses statistics reported by netstat.
 */
const parseStatistics = function parseStatistics() {
  const lines = output.split('\n');
  if (lines.length === 0) {
    logError('No statistics can be retrieved from netstat.');
    return;
  }
  // Only the first line is needed.
  const line = lines[0];
  const results = OUTPUT_PATTERN.exec(line);
  if ((results === null) || (results.length !== 3)) {
    logError('netstat output does not match expected pattern.');
    return;
  }
  // Log statistics to CSV file.
  // The second matching result is the number of incoming number of bytes.
  // The third matching result is the number of outgoing number of bytes.
  const inBytes = parseInt(results[1], 10);
  const outBytes = parseInt(results[2], 10);
  const totalBytes = inBytes + outBytes;
  fs.appendFile(
    OUTPUT_FILE_PATH,
    util.format(
      '%s,%d,%d,%d\n',
      getDateString(),
      inBytes,
      outBytes,
      totalBytes
    ),
    (appendFileError) => {
      if (appendFileError !== null) {
        logError(
          `Unable to log statistics to CSV file: ${appendFileError.message}`);
      }
    }
  );
};

/**
 * Starts retrieving statistics from netstat.
 */
const start = function start() {
  let netstatProcess = null;
  let grepProcess = null;

  // Use netstat to collect statistics of network interface.
  // -I: Specifies the network interface.
  // -b: Show the statistics in terms of number of bytes.
  netstatProcess = spawn(
    'netstat',
    [
      '-I',
      networkInterface,
      '-b'
    ]
  );

  // Use grep to filter headers from netstat output.
  grepProcess = spawn(
    'grep',
    [
      networkInterface
    ]
  );

  netstatProcess.stdout.on('data', (data) => {
    grepProcess.stdin.write(data);
  });

  netstatProcess.on('close', (code, signal) => {
    if (code === null) {
      logError(util.format('netstat killed with signal %s.', signal));
    }
    grepProcess.stdin.end();
  });

  grepProcess.stdout.on('data', (data) => {
    const dataBuffer = new Buffer(data, 'utf8');
    output += dataBuffer.toString();
  });

  grepProcess.on('close', (code, signal) => {
    if (code === null) {
      logError(util.format('grep killed with signal %s.', signal));
    } else {
      process.nextTick(parseStatistics);
    }
  });
};

fs.readFile(
  CONFIG_FILE_PATH,
  {
    encoding: 'utf8'
  },
  (readFileError, data) => {
    let config = null;
    if (readFileError !== null) {
      logError(`Unable to read configuration file: ${readFileError.message}`);
      return;
    }
    try {
      config = JSON.parse(data);
      networkInterface = config.interface;
      process.nextTick(start);
    } catch (parseError) {
      logError(`Unable to parse configuration file: ${parseError.message}`);
    }
  }
);
