# Bandwidth #

## Description ##

Small utility for collecting bandwidth usage.

Note: This application is tested on OpenBSD 5.8 only and is not guaranteed to work on other platforms.

## Requirements ##

* Node.js (`>=0.10.35`).

## Installation ##

1. Install Node.js.
2. Install the application by `npm install`.
3. Start the application by `node index.js`.

## Usage ##

Run the application, a CSV file (`bandwidth.csv`) is produced.

In case of errors, error logs will be written to `error.log`.

The configuration file `config.json` controls the following:

* interface: The name of network interface which you want to collect bandwidth usage data from. For example `em0`.

## Examples ##

Assuming you want to collect bandwidth usage from the network interface `em0`. prepare `config.json` with the following:

```
{
  "interface": "em0"
}
```

Then run the application by `node index.js`. A CSV file containing 4 columns will be generated:
1. The date of bandwidth usage collection, in the format `YYYY-MM-DD`.
2. The number of incoming bytes.
3. The number of outgoing bytes.
4. The total number of I/O bytes.

For example:

```
2015-10-31,18974025324,34145831737,53119857061
```

## Known issues ##

* (None)

## TODO ##

* (None)

## License ##

[The BSD 3-Clause License](http://opensource.org/licenses/BSD-3-Clause)
