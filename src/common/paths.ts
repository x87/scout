module cleojs.common {
    /**
     *
     * @type {{scriptFile: string}}
     */

    export const paths = {
        inputFile: 'test.cs',
        opcodesFile: function () {
            const map = {
                [eGame.GTA3] : "gta3.json",
                [eGame.GTAVC] : "gtavc.json",
                [eGame.GTASA] : "gtasa.json"
            }
            return require('path').join(__dirname, map[Arguments.game])
        }()
    }
}
