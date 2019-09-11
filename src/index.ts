import { main } from './main';
main().catch(e => {
  console.error(e.stack || `[CUSTOM ERROR]: ${e}`);
});
