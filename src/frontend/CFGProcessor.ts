module scout.frontend {

    import eGame = scout.common.eGame;
    const branchOpcodesMap: Object = {
        // 'call' opcodes (gosub, start_new_script, etc, is not included as they always have to return back
        [eGame.GTA3]: {
            0x0002: () => eBasicBlockType.ONE_WAY,
            0x004c: () => eBasicBlockType.TWO_WAY,
            0x004d: () => eBasicBlockType.TWO_WAY
        },
        [eGame.GTAVC]: {
            0x0002: () => eBasicBlockType.ONE_WAY,
            0x004d: () => eBasicBlockType.TWO_WAY
        },
        [eGame.GTASA]: {
            0x0002: () => eBasicBlockType.ONE_WAY,
            0x004d: () => eBasicBlockType.TWO_WAY
        }
    };

    export class CCFGProcessor {

        public findBasicBlocks(files: ICompiledFile[]) {
            files.forEach(this.findLeadersForFile.bind(this))
            files.forEach(this.findBasicBlocksForFile.bind(this))
            files.forEach(this.linkBasicBlocks.bind(this))
        }

        private linkBasicBlocks(file: ICompiledFile) {
            let prevBBtoLink = null;
            for (let [offset, bb] of file.basicBlocks) {

                if (prevBBtoLink) {
                    this.setBasicBlockSuccessor(prevBBtoLink, bb);
                    prevBBtoLink = null;
                }

                let lastOpcode = bb.opcodes[bb.opcodes.length - 1];
                let branchHandler = branchOpcodesMap[Arguments.game][lastOpcode.id];
                if (!branchHandler) {
                    bb.type = eBasicBlockType.FALL_THRU;
                    prevBBtoLink = bb;
                    continue;
                }

                bb.type = branchHandler();

                if (bb.type == eBasicBlockType.TWO_WAY) {
                    prevBBtoLink = bb;
                }

                if (bb.type == eBasicBlockType.N_WAY) {
                    // todo; set links to switch cases
                }

                let targetOffset = this.getOpcodeTargetOffset(lastOpcode);
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
                    throw Log.error("ERRNOFF", offset)
                }
                if (targetOffset >= 0 && file.type !== eCompiledFileType.MAIN) {
                    throw Log.error("ERRPOFF", offset)
                }
                let targetOpcode = <IOpcode>file.opcodes.get(Math.abs(targetOffset));
                if (!targetOpcode) {
                    throw Log.error("ENOTARG", offset)
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
                opcodes,
                predecessors: [],
                successors: [],
            };
        }

        private getOpcodeTargetOffset(opcode: IOpcode) {
            return Number(opcode.params[0].value)
        }

        private setBasicBlockSuccessor(bb, target) {
            bb.successors.push(target);
            target.predecessors.push(bb);
        }

    }
}
