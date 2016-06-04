namespace scout.frontend {

    import eGame = scout.common.eGame;
    import IOpcode = scout.common.IOpcode;
    import eBasicBlockType = scout.common.eBasicBlockType;
    const OP_JMP = 0x0002;
    const OP_JT = 0x004c;
    const OP_JF = 0x004d;
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

    export class CCFGProcessor {

        public findBasicBlocks(files: ICompiledFile[]) {
            files.forEach(this.findLeadersForFile.bind(this));
            files.forEach(this.findBasicBlocksForFile.bind(this));
            files.forEach(this.linkBasicBlocks.bind(this));
            files.forEach(this.findUnreachableBlocks.bind(this));
            files.forEach(this.findIntervals.bind(this));
        }

        private findIntervals(file: ICompiledFile) {

            if (!file.basicBlocks.size) {
                return;
            }
            let headers = [file.basicBlocks.values().next().value];
            let intervals = [];
            while (headers.length) {
                let interval: Array<IBasicBlock> = [];
                {
                    let h = headers.shift();
                    h['processed'] = true;
                    interval.push(h);
                }

                file.basicBlocks.forEach((bb: IBasicBlock) => {
                    if (bb.processed) return;
                    if (interval.indexOf(bb) === -1 && helpers.checkArrayIncludesArray(interval, bb.predecessors)) {
                        interval.push(bb);
                        bb.processed = true;
                    }
                });
                file.basicBlocks.forEach((bb: IBasicBlock) => {
                    if (bb.processed) return;
                    if (interval.indexOf(bb) === -1 && helpers.checkArrayIncludeItemFromArray(interval, bb.predecessors)) {
                        headers.push(bb);
                    }
                });
                intervals.push(interval);
            }
            file.intervals = intervals;
        }

        private findUnreachableBlocks(file: ICompiledFile) {
            let unreachableFound;
            let firstFound;
            do {
                unreachableFound = false;
                firstFound = true;
                file.basicBlocks.forEach((bb: IBasicBlock, key) => {
                    if (firstFound) {
                        firstFound = false;
                        return;
                    }

                    if (bb.predecessors.length > 0) {
                        return;
                    }

                    bb.successors.forEach((successor: IBasicBlock) => {
                        successor.predecessors.splice(successor.predecessors.indexOf(bb), 1);
                    });

                    file.basicBlocks.delete(key);
                    unreachableFound = true;
                });
            } while (unreachableFound);
        }

        private linkBasicBlocks(file: ICompiledFile) {
            let prevBBtoLink = null;
            for (let [offset, bb] of file.basicBlocks) {

                if (prevBBtoLink) {
                    this.setBasicBlockSuccessor(prevBBtoLink, bb);
                    prevBBtoLink = null;
                }

                let lastOpcode = bb.opcodes[bb.opcodes.length - 1];
                let branchType = branchOpcodesMap[Arguments.game][lastOpcode.id];
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
                while (targetOffset = this.getOpcodeTargetOffset(lastOpcode)) {
                    // eliminate jump-to-jump
                    lastOpcode = file.opcodes.get(Math.abs(targetOffset));
                    if (lastOpcode.id !== OP_JMP) {
                        break;
                    }
                }
                let targetBB = file.basicBlocks.get(Math.abs(targetOffset));
                this.setBasicBlockSuccessor(bb, targetBB);

            }
        }

        private findBasicBlocksForFile(file: ICompiledFile) {
            let currentLeader = null;
            let opcodes = [];
            for (let [offset, opcode] of file.opcodes) {
                if (opcode.isLeader) {
                    if (currentLeader) {
                        file.basicBlocks.set(currentLeader.offset, this.createBasicBlock(opcodes));
                    }
                    currentLeader = opcode;
                    opcodes = [];
                }
                opcodes[opcodes.length] = opcode;
            }
            // add last bb in the file
            file.basicBlocks.set(currentLeader.offset, this.createBasicBlock(opcodes));
        }

        private findLeadersForFile(file: ICompiledFile) {
            let isThisFirstInstructionOfFile = true;
            let isThisInstructionFollowBranchOpcode = false;

            for (let [offset, opcode] of file.opcodes) {

                opcode.isLeader = opcode.isLeader || isThisFirstInstructionOfFile || isThisInstructionFollowBranchOpcode;
                isThisFirstInstructionOfFile = false;
                isThisInstructionFollowBranchOpcode = false;
                if (!branchOpcodesMap[Arguments.game][opcode.id]) {
                    continue;
                }

                let targetOffset = this.getOpcodeTargetOffset(opcode);

                if (targetOffset < 0 && file.type === eCompiledFileType.MAIN) {
                    throw Log.error('ERRNOFF', offset);
                }
                if (targetOffset >= 0 && file.type !== eCompiledFileType.MAIN) {
                    throw Log.error('ERRPOFF', offset);
                }
                let targetOpcode = <IOpcode>file.opcodes.get(Math.abs(targetOffset));
                if (!targetOpcode) {
                    throw Log.error('ENOTARG', offset);
                }
                targetOpcode.isLeader = true;
                isThisInstructionFollowBranchOpcode = true;
            }
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
                processed: false
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
}
