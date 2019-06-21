/**
 * Main program.
 *
 * @author Alex TSANG <alextsang@live.com>
 *
 * @license BSD-3-Clause
 */

'use strict';

const Buffer = require('buffer').Buffer;
const fs = require('fs');
const { spawn } = require('child_process');

const config = require('./config.js');

// Pattern of netstat output to be captured (number of in/ out bytes).
const linePattern = /(\d+)\s+(\d+)$/;
const radix = 10;
const bufferEncoding = 'utf8';

/**
 * Gets date string in the format of YYYY-MM-DD.
 *
 * @returns {string} Date string.
 */
const getDateString = () => {
  // The ISO 8601 representation has the form YYYY-MM-DDTHH:mm:ss.sssZ. Extract
  // the part before the character "T".
  const dateString = (new Date()).toISOString();
  return dateString.substring(0, dateString.indexOf('T'));
};

/**
 * Logs statistics.
 *
 * @async
 *
 * @param {string} netstatOutput Output from netstat.
 * @param {string} logFile Log file path.
 *
 * @returns {Promise} Resolves without a value, or rejects with an Error.
 */
const logStat = async (netstatOutput, logFile) => {
  const lines = netstatOutput.split('\n');
  if (lines.length === 0) {
    return Promise.reject(
      new Error('No statistics can be retrieved from netstat.'));
  }
  // Only the first line is needed.
  const line = lines[0];
  const results = linePattern.exec(line);
  if ((results === null) || (results.length !== 3)) {
    return Promise.reject(
      new Error('netstat output does not match expected pattern.'));
  }
  // The second matching result is the number of incoming number of bytes.
  // The third matching result is the number of outgoing number of bytes.
  const dateString = getDateString();
  const inBytes = parseInt(results[1], radix);
  const outBytes = parseInt(results[2], radix);
  const totalBytes = inBytes + outBytes;
  return new Promise((resolve, reject) => {
    fs.appendFile(
      logFile,
      `${dateString},${inBytes},${outBytes},${totalBytes}\n`,
      (error) => {
        if (error !== null) {
          reject(new Error(`Unable to write log: ${error.message}`));
          return;
        }
        resolve();
      }
    );
  });
};

/**
 * Gets network statistics.
 *
 * @async
 *
 * @param {string} networkInterface Network interface.
 *
 * @returns {Promise} Resolves with output from netstat that contains the
 *                    network statistics, or rejects with an Error.
 */
const getStat = async (networkInterface) => {
  // Use netstat to collect statistics of network interface.
  // -I: Specifies the network interface.
  // -b: Show the statistics in terms of number of bytes.
  const netstatProcess = spawn(
    'netstat',
    [
      '-I',
      networkInterface,
      '-b'
    ]
  );
  // Use grep to filter headers from netstat output.
  const grepProcess = spawn(
    'grep',
    [
      networkInterface
    ]
  );
  return new Promise((resolve, reject) => {
    let output = '';
    netstatProcess.stdout.pipe(grepProcess.stdin);
    grepProcess.stdout.on('data', (data) => {
      const dataBuffer = Buffer.from(data, bufferEncoding);
      output += dataBuffer.toString();
    });
    grepProcess.once('close', (code, signal) => {
      if (code === null) {
        reject(new Error(`grep killed with signal ${signal}.`));
        return;
      }
      resolve(output);
    });
  });
};

/**
 * Main program.
 */
const main = async () => {
  try {
    const stat = await getStat(config.interface);
    await logStat(stat, config.logFile);
  } catch (error) {
    console.error(error.message);
  }
};

main();
