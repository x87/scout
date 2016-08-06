import Paths from '../common/paths';
import Log from '../utils/Log';

import { IOpcodeData, ICompiledFile, IOpcode, IOpcodeParamArray } from '../common/interfaces';
import { COpcodeParser } from '../frontend/OpcodeParser';
import { CScriptFile, CScriptFileSCM } from '../frontend/ScriptFile';
import { eCompiledFileType } from '../common/enums';
import * as fsHelpers from '../utils/fsHelpers';
import { Helpers as helpers } from '../utils/helpers';

export class CDisassembler {
    private _opcodeParser: COpcodeParser;
    private _opcodesData: IOpcodeData[];

    constructor () {
        this._opcodeParser = new COpcodeParser();
    }

    public disassemble(scriptFile: CScriptFile) {
        let files: ICompiledFile[] = [];
        files[files.length] = this.parseBuffer(scriptFile.baseOffset, scriptFile.type, scriptFile.mainData);

        if (scriptFile instanceof CScriptFileSCM) {
            for (let i = 0, len = scriptFile.missionsData.length; i < len; i += 1) {
                files[files.length] = this.parseBuffer(0, eCompiledFileType.MISSION, scriptFile.missionsData[i]);
            }
        }
        // todo; external data
        return files;
    }

    private parseBuffer(base: number, type: eCompiledFileType, data: Buffer) {
        this.opcodeParser.data = data;
        this.opcodeParser.offset = 0;

        let file = <ICompiledFile>{};
        file.opcodes = new Map();
        file.type = type;

        for (let opcode of this.opcodeParser) {
            opcode.offset += base;
            file.opcodes.set(opcode.offset, opcode);
        }
        return file;
    }

    /**
     *
     * @returns {Promise<TResult>|Promise<T>}
     */
    public loadOpcodeData() {
        return fsHelpers.isReadable(Paths.opcodesFile)
            .then(() => this.opcodesData = require(Paths.opcodesFile))
            .then(
                opcodesData => this._opcodeParser.opcodesData = opcodesData
            )
            .catch(() => {
                throw Log.error('ERRNOOP', Paths.opcodesFile);
            });
    }

    get opcodeParser(): COpcodeParser {
        return this._opcodeParser;
    }

    get opcodesData(): IOpcodeData[] {
        return this._opcodesData;
    }

    set opcodesData(value: IOpcodeData[]) {
        this._opcodesData = value;
    }

    public printOpcode(opcode: IOpcode) {
        let id = opcode.id;
        let info = this.opcodesData[id & 0x7FFF];
        let output = `${opcode.offset}: `;

        if (opcode.isLeader) {
            output = '\n\n' + output;
        }
        if (id > 0x7FFF) {
            output += 'NOT ';
        }
        output += info.name;
        for (let param of opcode.params) {
            if (helpers.isArrayParam(param.type)) {
                let a = <IOpcodeParamArray>param.value;
                output += ` (${a.varIndex} ${a.offset} ${a.size} ${a.props})`;
            } else {
                output += ' ' + param.value;
            }
        }
        Log.msg(output);
    }

}
