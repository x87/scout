module scout.frontend {

    import eGame = scout.common.eGame;
    import ICompiledFile = scout.common.ICompiledFile;
    const branchOpcodesMap: Object = {
        [eGame.GTA3]:  [
            0x0002, 0x004c, 0x004d
        ],
        [eGame.GTAVC]: [
            0x0002, 0x004d
        ],
        [eGame.GTASA]: [
            0x0002, 0x004d
        ]
    };


    export class CCFG {

        public findLeaderInstructions(files: ICompiledFile[]) {
            files.forEach(file => {
                let isThisFirstInstructionOfFile = true;
                let isThisInstructionFollowBranchOpcode = false;

                for (let [offset, opcode] of file.opcodes) {


                    if (isThisFirstInstructionOfFile) {
                        // first instruction is a leader
                        opcode.isLeader = true;
                        isThisFirstInstructionOfFile = false;
                    } else if (isThisInstructionFollowBranchOpcode) {
                        // instruction after branch opcode is a leader
                        opcode.isLeader = true;
                        isThisInstructionFollowBranchOpcode = false;
                    }


                    if (~branchOpcodesMap[Arguments.game].indexOf(opcode.id)) {

                        let targetOffset = Number(opcode.params[0].value);
                        let targetOpcode;

                        if (targetOffset < 0) {
                            if (file.type === eCompiledFileType.MAIN) {
                                throw Log.error("ERROFFS", offset)
                            }
                            targetOpcode = file.opcodes.get(-targetOffset);
                        } else {
                            // positive offsets are present only in MAIN section
                            targetOpcode = files[0].opcodes.get(targetOffset);
                        }

                        if (!targetOpcode) {
                            throw Log.error("ENOTARG", offset);
                        }

                        // target of branch opcode is a leader
                        targetOpcode.isLeader = true;
                        isThisInstructionFollowBranchOpcode = true;
                    }
                }

            })
            return files;
        }
    }
}
