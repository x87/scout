# Scout Decompiler

Scout Decompiler is a CLI tool to decompile binary scripts of Grand Theft Auto 3D series into a human-readable high-level format. 

## Build
Download and install NodeJS from https://nodejs.org. The minimum required NodeJS version to run is v8.9.4
```bash
git clone https://github.com/x87/scout.js.git
cd scout.js 
npm install
npm run build
```

### Build opcodes definitions
Opcode definitions are required to disassemble the bytecode.
```bash
node opcodes > build/gta3.json
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

| Option Name            | Description |
| --------------------- | --------
| `-g <game>`           | Target game. Possible options are: gta3, vc, sa
| `-p`                  | Print the result into stdout

Input/Output redirection is supported
```bash
node scout < inputfile -p > outputfile 
```

Get detailed help information
```bash
node scout -h 
```


#### Example
```bash
cd build
node scout < test.scm -g gta3 -p > out.txt
``` 
