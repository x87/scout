import Log from 'utils/log';
import Arguments from 'common/arguments';
import Disassembler from 'frontend/disassembler';
import Loader from 'frontend/loader';
import CFG from 'frontend/cfg';
import AppError from 'common/errors';
import SimplePrinter from './utils/simple-printer';

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

				Disassembler.getDefinitions().then(definitionMap => {
					const printer = new SimplePrinter(definitionMap);
					for (const [offset, instruction] of script.instructionMap) {
						printer.print(instruction);
					}
				});
			}
		});
	})
	.catch(e => { console.error(e.stack || `[CUSTOM ERROR]: ${e}`); });
