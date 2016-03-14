module scout.test {

    export function defined () {

        it("Arguments should be defined", () => {
            expect(Arguments).toBeDefined()
        });

        it("eGame should be defined", () => {
            expect(eGame).toBeDefined();
        });

        it("eGame should contain three elements", () => {
            expect(eGame.GTA3).toBeDefined();
            expect(eGame.GTAVC).toBeDefined();
            expect(eGame.GTASA).toBeDefined();
        });

        it("CDisassembler should be defined", () => {
            expect(CDisassembler).toBeDefined();
        });

        it("Loader should be defined", () => {
            expect(Loader).toBeDefined();
        });

        it("CCFGProcessor should be defined", () => {
            expect(CCFGProcessor).toBeDefined();
        });

    }
}

