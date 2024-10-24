# Logcat in devtools

View android adb logcat logs in chrome devtools console

<a href="https://npmjs.com/package/logcat-in-devtools"><img src="https://img.shields.io/npm/v/logcat-in-devtools.svg" alt="npm package"></a>

## Screenshot

![image](https://github.com/user-attachments/assets/eca5609d-b8cf-49cf-a234-76f028147030)

## Prerequisites

- [Android Debug Bridge (adb)](https://developer.android.com/tools/adb) should be installed and available in PATH and
- `adb devices` command should success list the connected device

  ```shell
  $ adb devices
  List of devices attached
  DEVICE_SERIAL_xxxx     device
  ```

## Basic Usage

```shell
npx logcat-in-devtools@latest
```

## Advanced Usage

```shell
# Clean logcat buffer before start and also print logcat log in terminal
npx logcat-in-devtools@latest --clean --show-log

# only print messages which include "aaa" or "bbb" or "ccc"
npx logcat-in-devtools@latest  --match="aaa\|bbb\|ccc" --show-log

# use device with given serial
npx logcat-in-devtools@latest --serial DEVICE_SERIAL_xxxx
```

### Cli options

```plaintext
$ npx logcat-in-devtools@latest --help

Usage: logcat-in-devtools [options]

View android adb logcat logs in chrome devtools console

Options:
  -V, --version          output the version number
  -c, --clean            clean logcat buffer before start
  -l, --show-log         also print logcat log in terminal
  -m, --match <RegExp>   only print messages that match RegExp
  -s, --serial <SERIAL>  use device with given serial (overrides $ANDROID_SERIAL)
  -h, --help             display help for command
```
