'use strict';

const args = process.argv.slice(2);
const inputFile = args[0] || 'gta3.ini';
let bufToLines = buf => buf.toString().split(require('os').EOL);
let opcodeNames = {};
let opcodeNumParams = {};
const fs = require('fs');
const path = require('path');

new Promise(function (resolve) {
    fs.readFile(path.join(__dirname, 'opcodes.txt'), function (err, buf) {
        resolve(bufToLines(buf)
            .filter(line => line)
            .forEach(line => {
                line = line.trim();
                if (line.charAt(0) == ';') return;
                let parts = line.split('=');
                opcodeNames[parts[0].toUpperCase()] = parts[1];
            }));
    });
}).then(function () {
    return new Promise(function (resolve) {
        fs.readFile(path.join(__dirname, inputFile), function (err, buf) {
            resolve(bufToLines(buf)
                .filter(line => line)
                .forEach(line=> {
                    let data = line.split(',');
                    let parts = data[0].split('=');
                    let opcode = parts[0].toUpperCase();
                    opcodeNumParams[opcode] = parts[1];
                }));
        });
    });
}).then(function () {
    let result = [];
    for (let opcode in opcodeNames) {
        if (opcodeNames.hasOwnProperty(opcode)) {
            try {
                let np = parseInt(opcodeNumParams[opcode], 10) || 0;
                result[result.length] = {
                    id: opcode,
                    name: opcodeNames[opcode] || 'NOP',
                    params: np === -1 ? null : new Array(np).fill({
                        type: 'any'
                    })
                };
            } catch (e) {
                console.log(e);
            }
        }
    }
    return result;
}).then(function (result) {
    console.log(JSON.stringify(result, undefined, 4));
});
