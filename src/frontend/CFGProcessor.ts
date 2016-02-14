module scout.frontend {

    import eGame = scout.common.eGame;
    const branchOpcodesMap: Object = {
        [eGame.GTA3]: {
            0x0002: true,
            0x004c: true,
            0x004d: true
        },
        [eGame.GTAVC]: {
            0x0002: true,
            0x004d: true
        },
        [eGame.GTASA]: {
            0x0002: true,
            0x004d: true
        }
    };

    export class CCFGProcessor {

        public findBasicBlocks(files: ICompiledFile[]) {
            files.forEach(file => this.findLeadersForFile(file, files[0].opcodes))
            files.forEach(file => this.findBasicBlocksForFile(file))
        }


        private findBasicBlocksForFile(file: ICompiledFile) {
            let currentLeader = null;
            let opcodes = [];
            for (let [offset, opcode] of file.opcodes) {
                if (opcode.isLeader) {
                    if (currentLeader) {
                        file.basicBlocks.push(this.createBasicBlock(opcodes));
                    }
                    currentLeader = opcode;
                    opcodes = [];
                }
                opcodes[opcodes.length] = opcode;
            }
            // add last bb in the file
            file.basicBlocks.push(this.createBasicBlock(opcodes));
        }

        private findLeadersForFile(file: ICompiledFile, mainSectionOpcodes: TOpcodesMap) {
            let isThisFirstInstructionOfFile = true;
            let isThisInstructionFollowBranchOpcode = false;

            for (let [offset, opcode] of file.opcodes) {

                opcode.isLeader = isThisFirstInstructionOfFile || isThisInstructionFollowBranchOpcode;
                isThisFirstInstructionOfFile = false;
                isThisInstructionFollowBranchOpcode = false;

                if (!branchOpcodesMap[Arguments.game][opcode.id]) {
                    continue;
                }
                let targetOffset = Number(opcode.params[0].value);
                let targetOpcode;

                if (targetOffset < 0) {
                    if (file.type === eCompiledFileType.MAIN) {
                        throw Log.error("ERROFFS", offset)
                    }
                    targetOpcode = file.opcodes.get(-targetOffset);
                } else {
                    // positive offsets are present only in MAIN section
                    // todo; find a better way to get this opcode
                    targetOpcode = mainSectionOpcodes.get(targetOffset);
                }

                if (!targetOpcode) {
                    throw Log.error("ENOTARG", offset);
                }

                // target of branch opcode is a leader
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

    }
}
