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

Scout uses command definitions from Sanny Builder Library. They are required to decompile the bytecode. You can download the latest version by following these links:

- [GTA3](https://raw.githubusercontent.com/sannybuilder/library/master/gta3/gta3.json)
- [VC](https://raw.githubusercontent.com/sannybuilder/library/master/vc/vc.json)

Place JSON files next to the `scout.js` file before decompiling.

## Command-line interface

```bash
node.exe scout <inputfile> [....options]
```

| Option Name | Description                                     |
| ----------- | ----------------------------------------------- |
| `-g <game>` | Target game. Possible values are: gta3, vc, sa |

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
