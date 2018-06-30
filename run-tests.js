const path = require('path');
require('ts-node/register');
require('tsconfig-paths/register');

const Jasmine = require('jasmine');
const Command = require('jasmine/lib/command');

const jasmine = new Jasmine();
jasmine.loadConfig({
	'spec_dir': 'src',
	'spec_files': [
		'**/*[sS]pec.ts'
	],
	'helpers': ['../node_modules/jasmine-expect']
});
const command = new Command(path.resolve());
command.run(jasmine, process.argv.slice(2));
