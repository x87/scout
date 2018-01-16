import Log from 'utils/log';
import Arguments from 'common/arguments';
import Disassembler from 'frontend/Disassembler';
import Loader from 'frontend/loader';
import CFG from 'frontend/cfg';
import AppError from 'common/errors';

if (!Arguments.inputFile) {
	throw Log.error(AppError.NO_INPUT);
}

const disasm = new Disassembler();
const loader = new Loader();

loader.loadScript(Arguments.inputFile)
	.then(scriptFile => disasm.disassemble(scriptFile))
	.then(scripts => {
		const graph = new CFG(scripts);
		return scripts;
	})
	.then(scripts => {
		scripts.forEach(script => {
			if (Arguments.printAssembly === true) {
				for (const [offset, opcode] of script.opcodes) {
					disasm.printOpcode(opcode);
				}
			}
		});
	})
	.catch(e => { console.error(e.stack || `[CUSTOM ERROR]: ${e}`); });
