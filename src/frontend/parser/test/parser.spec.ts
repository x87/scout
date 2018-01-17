import Parser from '../';
import { IOpcode, OpcodeMap } from 'common/interfaces';
import { eParamType } from 'common/enums';

describe(Parser.name, () => {

	let opcodes: OpcodeMap;

	beforeAll(() => {
		opcodes = new Map();
		opcodes.set(1, { name: 'WAIT', params: [{type: 'any'}] });
		opcodes.set(2, { name: 'GOTO', params: [{type: 'any'}] });
	});

	afterAll(() => {
		opcodes = null;
	});

	it('should correctly parse input buffer', () => {
		const buf = Buffer.from(`0100040002000164000000`, 'hex');
		const parsed: IOpcode[] = [
			{
				id: 1,
				offset: 0,
				isHeader: false,
				isLeader: false,
				params: [{
					type: eParamType.NUM8,
					value: 0
				}]
			},
			{
				id: 2,
				offset: 4,
				isHeader: false,
				isLeader: false,
				params: [{
					type: eParamType.NUM32,
					value: 100
				}]
			}
		];
		const parser = new Parser(opcodes, buf, 0);

		for (const opcode of parser) {
			expect(opcode).toEqual(parsed.shift());
		}
		expect(true).toBe(true);
	});

});
