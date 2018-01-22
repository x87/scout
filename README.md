# Scout Decompiler

Scout Decompiler is a CLI tool to decompile binary scripts of Grand Theft Auto 3D series into a human-readable high-level format. 

## Build
Download and install NodeJS from https://nodejs.org. Minimum required NodeJS version to run is v8.9.4
```bash
git clone https://github.com/x87/scout.js.git
cd scout.js 
npm install
npm run build
```

### Build opcodes definitions
```bash
node opcodes > build/gta3.json
```

## Usage

### Command-line interface
```bash
node scout <inputfile> [....optional parameters] 
``` 

| Param Name            | Description |
| --------------------- | --------
| `-i [inputfile]`      | Input file path. Optional. 
| `-g [game]`           | Target game. Possible options for [game] are: gta3, gtavc, vc, gtasa, sa
| `-p`                  | Print the result into stdout

#### Example
```bash
cd build
node scout test.scm -g gta3 -p > out.txt 
``` 

## Running tests
```bash
npm test
```