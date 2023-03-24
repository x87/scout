# Scout Decompiler

Scout Decompiler is an experimental CLI tool to decompile binary scripts of Grand Theft Auto 3D series into a human-readable high-level format.

Also available online at https://scout.sannybuilder.com/

Use at your own risk. Not intended for production use.

## Prerequisites

Download and install Node.js from https://nodejs.org. Then run the following commands:

```bash
git clone https://github.com/x87/scout.git
cd scout
npm install
npm run build
```

It will create a `build` folder with the `scout.js` file.

### Command definitions

Scout uses command definitions from Sanny Builder Library. It downloads them from GitHub automatically.

If you need to update the files, simply delete `gta3.json` or `vc.json` from the Scout directory and re-run the tool.

## Command-line interface

```bash
node.exe scout <inputfile> [....options]
```

| Option Name | Description                                |
| ----------- | ------------------------------------------ |
| `-g <game>` | Target game. Possible values are: gta3, vc |

Input/Output redirection is supported

```bash
node.exe scout < inputfile > outputfile
```

Get detailed help information

```bash
node.exe scout -h
```

### Example

```bash
cd build
node.exe scout < gta3.scm -g gta3 > out.txt
```
