import Parser from '../';
import ScriptFile from 'frontend/script/ScriptFile';
import { DefinitionMap } from 'common/interfaces';
import { eParamType, eScriptType } from 'common/enums';
import { IInstruction } from 'common/instructions';

describe(Parser.name, () => {

	let opcodes: DefinitionMap;
	let parser: Parser;

	beforeAll(() => {
		opcodes = new Map();
		opcodes.set(1, { name: 'WAIT', params: [{type: 'any'}] });
		opcodes.set(2, { name: 'GOTO', params: [{type: 'any'}] });
		parser = new Parser(opcodes);
	});

	afterAll(() => {
		opcodes = null;
		parser = null;
	});

	it('should create a Script out of input ScriptFile', () => {
		const scriptFile = new ScriptFile(Buffer.from([]));
		const spy = spyOn(parser, 'getInstructions').and.callThrough();
		const script = parser.parse(scriptFile);

		expect(script.length).toBe(1);
		expect(script[0].type).toBe(eScriptType.HEADLESS);
		expect(script[0].instructionMap instanceof Map).toBe(true);
		expect(spy).toHaveBeenCalledWith(scriptFile);
	});

	it('should parse instructions out of input ScriptFile', () => {
		const buf = Buffer.from(`0100040002000164000000`, 'hex');
		const scriptFile = new ScriptFile(buf);

		const parsed: IInstruction[] = [
			{
				opcode: 1,
				offset: 0,
				params: [{
					type: eParamType.NUM8,
					value: 0
				}]
			},
			{
				opcode: 2,
				offset: 4,
				params: [{
					type: eParamType.NUM32,
					value: 100
				}]
			}
		];
		const instructionMap = parser.getInstructions(scriptFile);

		for (const [offset, instruction] of instructionMap) {
			expect(instruction).toEqual(parsed.shift());
		}

	});

});
