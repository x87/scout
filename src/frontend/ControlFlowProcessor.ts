import {
    IOpcode,
    ICompiledFile,
    IBasicBlock,
    TBasicBlockMap,
    TOpcodesMap
} from '../common/interfaces';
import { eGame, eBasicBlockType, eCompiledFileType } from '../common/enums';
import { Helpers } from '../utils/helpers';
import Arguments from '../common/arguments';
import Log from '../utils/Log';

const OP_JMP = 0x0002;
const OP_JT = 0x004c;
const OP_JF = 0x004d;
const OP_END = 0x004e;
const OP_CALL = 0x004f;
const OP_GOSUB = 0x0050;
const OP_RETURN = 0x0051;
const blockEndOpcodes = [OP_END, OP_RETURN];
const callOpcodes = [OP_GOSUB, OP_CALL];

const branchOpcodesMap: Object = {
    // 'call' opcodes (gosub, start_new_script, etc, is not included as they always have to return back
    [eGame.GTA3]:  {
        [OP_JMP]: eBasicBlockType.ONE_WAY,
        [OP_JF]:  eBasicBlockType.TWO_WAY,
        [OP_JT]:  eBasicBlockType.TWO_WAY
    },
    [eGame.GTAVC]: {
        [OP_JMP]: eBasicBlockType.ONE_WAY,
        [OP_JF]:  eBasicBlockType.TWO_WAY
    },
    [eGame.GTASA]: {
        [OP_JMP]: eBasicBlockType.ONE_WAY,
        [OP_JF]:  eBasicBlockType.TWO_WAY
    }
};

export class CControlFlowProcessor {

    public buildCFG(files: ICompiledFile[]) {
        return files.map(file => this.findIntervalsInFile(file));
    }

    public findIntervalsInFile(file: ICompiledFile) {
        const opcodes = this.findLeadersForFile(file.opcodes, file.type);
        const basicBlocks = this.findUnreachableBlocks(
            this.linkBasicBlocks(
                this.findBasicBlocksForFile(opcodes), opcodes
            )
        );
        return this.findIntervals(basicBlocks);
    }

    private findIntervals(basicBlocks: TBasicBlockMap) {

        if (!basicBlocks.size) {
            return;
        }
        let headers = [basicBlocks.values().next().value];
        let intervals = [];
        while (headers.length) {
            let interval: Array<IBasicBlock> = [];
            {
                const h = headers.shift();
                (<IBasicBlock>h).processed = true;
                interval.push(h);
            }

            basicBlocks.forEach((bb: IBasicBlock) => {
                if (bb.processed) return;
                if (interval.indexOf(bb) === -1 && Helpers.checkArrayIncludesArray(interval, bb.predecessors)) {
                    interval.push(bb);
                    bb.processed = true;
                }
            });
            basicBlocks.forEach((bb: IBasicBlock) => {
                if (bb.processed) return;
                if (interval.indexOf(bb) === -1 && Helpers.checkArrayIncludeItemFromArray(interval, bb.predecessors)) {
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
            });
        } while (unreachableFound);

        return basicBlocks;
    }

    private linkBasicBlocks(basicBlocks: TBasicBlockMap, opcodes: TOpcodesMap) {
        let prevBBtoLink = null;
        for (let [offset, bb] of basicBlocks) {

            if (prevBBtoLink) {
                this.setBasicBlockSuccessor(prevBBtoLink, bb);
                prevBBtoLink = null;
            }

            let lastOpcode = bb.opcodes[bb.opcodes.length - 1];
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
                Log.warn('WNOBRAN', targetOffset);
                break;
            }
            this.setBasicBlockSuccessor(bb, targetBB);

        }

        return basicBlocks;
    }

    private findBasicBlocksForFile(opcodes: TOpcodesMap) {
        let currentLeader = null;
        let bbOpcodes = [];
        let basicBlocks = new Map();
        for (let [offset, opcode] of opcodes) {
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

    /**
     *
     * @param {TOpcodesMap} opcodes Opcodes map
     * @param {eCompiledFileType} fileType
     * @returns {TOpcodesMap}
     */
    private findLeadersForFile(opcodes: TOpcodesMap, fileType: eCompiledFileType) {
        let isThisInstructionFollowBranchOpcode = false;
        for (let [offset, opcode] of opcodes) {

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

            let targetOffset = this.getOpcodeTargetOffset(opcode);

            if (targetOffset < 0 && fileType === eCompiledFileType.MAIN) {
                throw Log.error('ERRNOFF', offset);
            }
            if (targetOffset >= 0 && fileType !== eCompiledFileType.MAIN) {
                // todo: gosubs with positive offsets in missions are allowed
                throw Log.error('ERRPOFF', offset);
            }
            let targetOpcode = <IOpcode>opcodes.get(Math.abs(targetOffset));
            if (!targetOpcode) {
                Log.warn('WNOTARG', offset);
                continue;
            }
            targetOpcode.isLeader = true;
            targetOpcode.isHeader = callOpcodes.indexOf(opcode.id) !== -1;
            isThisInstructionFollowBranchOpcode = callOpcodes.indexOf(opcode.id) === -1;
        }
        return opcodes;
    }

    /**
     *
     * @param opcodes
     * @returns {IBasicBlock}
     */
    private createBasicBlock(opcodes) {
        return <IBasicBlock>{
            type: eBasicBlockType.UNDEFINED,
            opcodes,
            predecessors: [],
            successors:   [],
            processed: false,
            isHeaderBlock: opcodes[0].isHeader
        };
    }

    private getOpcodeTargetOffset(opcode: IOpcode) {
        return Number(opcode.params[0].value);
    }

    private setBasicBlockSuccessor(bb, target) {
        bb.successors.push(target);
        target.predecessors.push(bb);
    }

}

