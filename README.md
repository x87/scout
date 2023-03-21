# Scout Decompiler

[![Build Status](https://travis-ci.org/x87/scout.svg?branch=master)](https://travis-ci.org/x87/scout)

Scout Decompiler is a CLI tool to decompile binary scripts of Grand Theft Auto 3D series into a human-readable high-level format.

## Build

Download and install Node.js from https://nodejs.org. Then run the following commands.

```bash
git clone https://github.com/x87/scout.git
cd scout
npm install
npm run build
```

### Build opcodes definitions

Opcode definitions are required to disassemble the bytecode.

```bash
mkdir -p build && node opcodes > build/gta3.json
```

### Running tests

```bash
npm test
```

## Usage

Build the tool and opcode definitions first. Put them into the same directory. Decompile a file using the following commands.

### Command-line interface

```bash
node scout <inputfile> [....options]
```

| Option Name | Description                                     |
| ----------- | ----------------------------------------------- |
| `-g <game>` | Target game. Possible options are: gta3, vc, sa |

Input/Output redirection is supported

```bash
node.exe scout < inputfile > outputfile
```

Get detailed help information

```bash
node.exe scout -h
```

#### Example

```bash
cd build
node.exe scout < test.scm -g gta3 > out.txt
```
