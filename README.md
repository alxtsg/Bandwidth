# Bandwidth #

## Description ##

Small utility for collecting bandwidth usage on OpenBSD.

This application is developed and tested on OpenBSD 6.5.

## Requirements ##

* Node.js (`>=8.12.0`).

## Installation ##

0. `npm install --production`

## Configuration ##

Make a copy of `.env.template` and name the new file as `.env`. The `.env` file
controls the following:

* `INTERFACE`: The network interface name.
* `LOG_FILE`: The path of log file. If the path is a relative path, it is
              relative to the installation directory.

## Usage ##

Navigate to the installation directory and run `index.js` using Node.js:

```
node index.js
```

A CSV file is produced at the location as specified in `LOG_FILE`. The CSV file
contains the following columns:

1. The date of bandwidth usage collection, in the format `YYYY-MM-DD`.
2. The number of incoming bytes.
3. The number of outgoing bytes.
4. The total number of I/O bytes.

For example:

```
2015-10-31,18974025324,34145831737,53119857061
```

In case of errors, the error message is written to `stderr`.

## License ##

[The BSD 3-Clause License](http://opensource.org/licenses/BSD-3-Clause)
