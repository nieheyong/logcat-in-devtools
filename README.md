# Logcat in devtools

View android adb logcat logs in chrome devtools console

## Prerequisites

- Android adb should be installed and available in PATH and
- Connect adb device to computer

## Usage

```shell
npx logcat-in-devtools@latest
```

### Options

```
$ npx logcat-in-devtools@latest --help

Usage: logcat-in-devtools [options]

View android adb logcat logs in chrome devtools console

Options:
  -V, --version          output the version number
  -m, --match <RegExp>   only print messages that match RegExp
  -s, --serial <SERIAL>  use device with given serial (overrides $ANDROID_SERIAL)
  -h, --help             display help for command
```


## Screenshot
![image](https://github.com/user-attachments/assets/eca5609d-b8cf-49cf-a234-76f028147030)
![image](https://github.com/user-attachments/assets/4c7e84ce-13ac-45ac-a027-dee4e2ad4cf0)

