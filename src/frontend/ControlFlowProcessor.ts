import * as _ from 'lodash';
import * as utils from 'utils';
import Log from 'utils/Log';

import Arguments from 'common/arguments';
import AppError from 'common/errors';
import LoopService from './LoopService';

import { IBasicBlock, IScript, IOpcode, TBasicBlockMap, TOpcodesMap } from 'common/interfaces';
import { eBasicBlockType, eScriptType, eGame } from 'common/enums';

const OP_JMP = 0x0002;
const OP_JT = 0x004c;
const OP_JF = 0x004d;
const OP_END = 0x004e;
const OP_CALL = 0x004f;
const OP_GOSUB = 0x0050;
const OP_RETURN = 0x0051;
const blockEndOpcodes = [OP_END, OP_RETURN];

// https://github.com/x87/scout.js/issues/3
// todo: refactor building flow graph on per-function basic, not per-file
// each call opcode must create a new subgraph
// isHeaderBlock is true for the first bb in each subgraph
// file start with main function and first subgraph

const callOpcodes = [OP_GOSUB, OP_CALL];

const branchOpcodesMap: any = {
	// 'call' opcodes (gosub, start_new_script, etc, is not included as they always have to return back
	[eGame.GTA3]: {
		[OP_JMP]: eBasicBlockType.ONE_WAY,
		[OP_JF]: eBasicBlockType.TWO_WAY,
		[OP_JT]: eBasicBlockType.TWO_WAY
	},
	[eGame.GTAVC]: {
		[OP_JMP]: eBasicBlockType.ONE_WAY,
		[OP_JF]: eBasicBlockType.TWO_WAY
	},
	[eGame.GTASA]: {
		[OP_JMP]: eBasicBlockType.ONE_WAY,
		[OP_JF]: eBasicBlockType.TWO_WAY
	}
};

export default class CControlFlowProcessor {

	buildCFG(files: IScript[]) {
		// https://github.com/x87/scout.js/issues/3
		// todo: split by functions
		files.map(file => {
			const intervals = this.findIntervalsInFile(file);
			intervals.forEach(interval => this.findLoops(interval));
		});
	}

	findIntervalsInFile(file: IScript) {
		const opcodes = this.findLeadersForFile(file.opcodes, file.type);
		const basicBlocks = this.findUnreachableBlocks(
			this.linkBasicBlocks(
				this.findBasicBlocksForFile(opcodes)
			)
		);
		return this.findIntervals(basicBlocks);
	}

	private findLoops(interval: IBasicBlock[]) {
		const head = _.head(interval);

		const latchingNode = _(interval)
		.chain()
		.intersection(head.predecessors)
		.head()
		.value();

		if (latchingNode) {
			const loopType = LoopService.findLoopType(head, latchingNode);
			this.findLoopNodes(interval, head, latchingNode);
		}
	}

	private findLoopNodes(interval: IBasicBlock[], head: IBasicBlock, latchingNode: IBasicBlock) {

		const start = _.findIndex(interval, head);
		const end = _.findIndex(interval, latchingNode);
		const nodes = _.slice(interval, start, end - start + 1);

		_.each(nodes, node => {
			if (node.inLoop) {
				console.log('node already in a loop');
			}
			node.inLoop = true;
		});
	}

	private findIntervals(basicBlocks: TBasicBlockMap) {

		if (!basicBlocks.size) {
			return;
		}
		const headers = [basicBlocks.values().next().value];
		const intervals = [];
		while (headers.length) {
			const header: IBasicBlock = headers.shift();
			header.processed = true;

			const interval: IBasicBlock[] = [header];

			basicBlocks.forEach((bb: IBasicBlock) => {
				if (bb.processed) return;
				if (!_.includes(interval, bb) && utils.checkArrayIncludesArray(interval, bb.predecessors)) {
					interval.push(bb);
					bb.processed = true;
				}
			});
			basicBlocks.forEach((bb: IBasicBlock) => {
				if (bb.processed) return;
				if (!_.includes(interval, bb) && utils.checkArrayIncludeItemFromArray(interval, bb.predecessors)) {
					headers.push(bb);
				}
			});
			intervals.push(interval);
		}

		return intervals;
	}

	private findUnreachableBlocks(basicBlocks: TBasicBlockMap) {
		let unreachableFound;
		do {
			unreachableFound = false;
			basicBlocks.forEach((bb: IBasicBlock, key) => {
				if (bb.isHeaderBlock) {
					return;
				}

				if (bb.predecessors.length > 0) {
					return;
				}

				bb.successors.forEach((successor: IBasicBlock) => {
					successor.predecessors.splice(successor.predecessors.indexOf(bb), 1);
				});

				basicBlocks.delete(key);
				unreachableFound = true;

				Log.warn(AppError.UNREACHABLE_BRANCH, bb.opcodes[0].offset);
			});
		} while (unreachableFound);

		return basicBlocks;
	}

	private linkBasicBlocks(basicBlocks: TBasicBlockMap) {
		let prevBBtoLink = null;
		for (const [offset, bb] of basicBlocks) {

			if (prevBBtoLink) {
				this.setBasicBlockSuccessor(prevBBtoLink, bb);
				prevBBtoLink = null;
			}

			const lastOpcode = bb.opcodes[bb.opcodes.length - 1];
			const branchType = branchOpcodesMap[Arguments.game][lastOpcode.id];

			if (!branchType) {
				bb.type = eBasicBlockType.FALL_THRU;
				prevBBtoLink = bb;
				continue;
			}

			bb.type = branchType;

			if (bb.type === eBasicBlockType.TWO_WAY) {
				prevBBtoLink = bb;
			}

			if (bb.type === eBasicBlockType.N_WAY) {
				// todo; set links to switch cases
			}

			let targetOffset;
			targetOffset = this.getOpcodeTargetOffset(lastOpcode);

			// eliminate jump-to-jump transitions
			/*while (true) {
				targetOffset = this.getOpcodeTargetOffset(lastOpcode);

				// check if we got a number, including 0.
				if (!isFinite(targetOffset)) {
					break;
				}
				lastOpcode = opcodes.get(Math.abs(targetOffset));
				if (!lastOpcode || lastOpcode.id !== OP_JMP) {
					break;
				}
			}*/

			const targetBB = basicBlocks.get(Math.abs(targetOffset));

			if (!targetBB) {
				Log.warn(AppError.NO_BRANCH, targetOffset);
				break;
			}
			this.setBasicBlockSuccessor(bb, targetBB);

		}

		return basicBlocks;
	}

	private findBasicBlocksForFile(opcodes: TOpcodesMap) {
		let currentLeader = null;
		let bbOpcodes = [];
		const basicBlocks = new Map();
		for (const [offset, opcode] of opcodes) {
			if (opcode.isLeader) {
				if (currentLeader) {
					basicBlocks.set(currentLeader.offset, this.createBasicBlock(bbOpcodes));
				}
				currentLeader = opcode;
				bbOpcodes = [];
			}
			bbOpcodes[bbOpcodes.length] = opcode;
		}
		// add last bb in the file
		basicBlocks.set(currentLeader.offset, this.createBasicBlock(bbOpcodes));

		return basicBlocks;
	}

	private findLeadersForFile(opcodes: TOpcodesMap, fileType: eScriptType) {
		let isThisInstructionFollowBranchOpcode = false;
		for (const [offset, opcode] of opcodes) {

			opcode.isLeader = opcode.isLeader || isThisInstructionFollowBranchOpcode;

			if (blockEndOpcodes.indexOf(opcode.id) !== -1) {
				isThisInstructionFollowBranchOpcode = true;
				continue;
			}

			isThisInstructionFollowBranchOpcode = false;

			const branchType = branchOpcodesMap[Arguments.game][opcode.id];
			if (!branchType) {
				continue;
			}

			const targetOffset = this.getOpcodeTargetOffset(opcode);

			if (targetOffset < 0 && fileType === eScriptType.MULTIFILE) {
				throw Log.error(AppError.INVALID_REL_OFFSET, offset);
			}
			if (targetOffset >= 0 && fileType !== eScriptType.MULTIFILE) {
				// todo: gosubs with positive offsets in headless files are allowed
				throw Log.error(AppError.INVALID_ABS_OFFSET, offset);
			}
			const targetOpcode: IOpcode = opcodes.get(Math.abs(targetOffset));
			if (!targetOpcode) {
				Log.warn(AppError.NO_TARGET, offset);
				continue;
			}
			targetOpcode.isLeader = true;

			// https://github.com/x87/scout.js/issues/3
			// todo: refactor graphs on per-function and remove this
			targetOpcode.isHeader = callOpcodes.indexOf(opcode.id) !== -1;

			isThisInstructionFollowBranchOpcode = callOpcodes.indexOf(opcode.id) === -1;
		}
		return opcodes;
	}

	private createBasicBlock(opcodes) {
		return {
			type: eBasicBlockType.UNDEFINED,
			opcodes,
			predecessors: [],
			successors: [],
			processed: false,
			inLoop: false,

			// https://github.com/x87/scout.js/issues/3
			// todo: true for the first bb in subgraph
			isHeaderBlock: opcodes[0].isHeader

		} as IBasicBlock;
	}

	private getOpcodeTargetOffset(opcode: IOpcode) {
		return Number(opcode.params[0].value);
	}

	private setBasicBlockSuccessor(bb, target) {
		bb.successors.push(target);
		target.predecessors.push(bb);
	}

}
