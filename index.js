/**
 * Main program.
 *
 * @author Alex Tsang <alextsang@live.com>
 *
 * @license BSD-3-Clause
 */
(function () {

  'use strict';

  const Buffer = require('buffer').Buffer,
    fs = require('fs'),
    path = require('path'),
    spawn = require('child_process').spawn,
    util = require('util'),

    // Pattern of netstat output to be captured (number of in/ out bytes).
    OUTPUT_PATTERN = /(\d+)\s+(\d+)$/,

    // Configuration filename.
    CONFIG_FILENAME = path.join(
      __dirname,
      'config.json'
    ),

    // Error log filename.
    ERROR_FILENAME = path.join(
      __dirname,
      'error.log'
    ),

    // Output CSV filename.
    OUTPUT_FILENAME = path.join(
      __dirname,
      'bandwidth.csv'
    );

  // Interface name.
  let networkInterface = null,

    // Captured output from netstat.
    output = '',

    /**
     * Gets date string in the format of YYYY-MM-DD.
     *
     * @returns {string} Date string.
     */
    getDateString = function () {
      let date = new Date(),
        dateString = date.toISOString();
      dateString = dateString.split('T')[0];
      return dateString;
    },

    /**
     * Logs error message.
     *
     * @param {string} message Error message.
     */
    logError = function (message) {
      fs.appendFile(
        ERROR_FILENAME,
        util.format(
          '%s\n',
          message
        ),
        function (appendFileError) {
          if (appendFileError !== null) {
            console.error(message);
          }
        }
      );
    },

    /**
     * Parses statistics reported by netstat.
     */
    parseStatistics = function () {
      let lines = output.split('\n');
      if (lines.length === 0) {
        logError('No statistics can be retrieved from netstat.');
        return;
      }
      // Only the first line is needed.
      let line = lines[0],
        results = OUTPUT_PATTERN.exec(line);
      if ((results === null) || (results.length !== 3)) {
        logError('netstat output does not match expected pattern.');
        return;
      }
      // Log statistics to CSV file.
      // The second matching result is the number of incoming number of bytes.
      // The third matching result is the number of outgoing number of bytes.
      let inBytes = parseInt(results[1], 10),
        outBytes = parseInt(results[2], 10),
        totalBytes = inBytes + outBytes;
      fs.appendFile(
        OUTPUT_FILENAME,
        util.format(
          '%s,%d,%d,%d\n',
          getDateString(),
          inBytes,
          outBytes,
          totalBytes
        ),
        function (appendFileError) {
          if (appendFileError !== null) {
            logError(
              'Unable to log statistics to CSV file: ' + appendFileError);
          }
        }
      );
    },

    /**
     * Starts retrieving statistics from netstat.
     */
    start = function () {
      let  netstatProcess = null,
        grepProcess = null;

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

      netstatProcess.stdout.on('data', function (data) {
        grepProcess.stdin.write(data);
      });

      netstatProcess.on('close', function (code, signal) {
        if (code === null) {
          logError(util.format('netstat killed with signal %s.', signal));
        }
        grepProcess.stdin.end();
      });

      grepProcess.stdout.on('data', function (data) {
        let dataBuffer = new Buffer(data, 'utf8');
        output += dataBuffer.toString();
      });

      grepProcess.on('close', function (code, signal) {
        if (code === null) {
          logError(util.format('grep killed with signal %s.', signal));
        } else {
          process.nextTick(parseStatistics);
        }
      });
    };

  fs.readFile(
    CONFIG_FILENAME,
    {
      encoding: 'utf8'
    },
    function (readFileError, data) {
      let config = null;
      if (readFileError !== null) {
        logError('Unable to read configuration file: ' + readFileError);
        return;
      }
      try {
        config = JSON.parse(data);
        networkInterface = config.interface;
        process.nextTick(start);
      } catch (parseError) {
        logError('Unable to parse configuration file: ' + parseError);
      }
    }
  );
}());
