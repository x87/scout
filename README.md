# Scout Decompiler

Scout Decompiler is a tool to decompile binary scripts of Grand Theft Auto series games into a human-readable high-level format. 

It is written in TypeScript and requires NodeJS to run.

### Version
0.2

### Build
```bash
npm install
npm run build
```

#### Build opcodes definitions
```bash
npm run opcodes > build/gta3.json
```

### Run
```bash
cd build
node scout test.scm -g gta3 -p > out.txt 
``` 

### Test
```bash
npm test
```