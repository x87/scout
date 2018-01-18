import { main } from './main';
try {
	main();
} catch (e) {
	console.error(e.stack || `[CUSTOM ERROR]: ${e}`);
}
