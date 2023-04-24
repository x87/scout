import { getDefinitions } from 'definitions';
import { Loader } from 'frontend/loader';
import { Parser } from 'frontend/parser';
import { bufferFromHex } from 'utils/file';
import { ExpressionPrinter } from 'utils/printer/ExpressionPrinter';
import { CFG } from '../../cfg';
import { print } from '../../../main';

export async function decompile(source) {
  const scripts = await parseSource(source);
  const cfg = new CFG();
  const graph = cfg.getCallGraphs(scripts[0], scripts);

  let result = '';
  const printer = new ExpressionPrinter(await getDefinitions());
  jest.spyOn(printer, 'printLine').mockImplementation((line) => {
    result += printer.indentation + line + '\n';
  });

  print(graph, printer, scripts[0]);
  return result;
}

async function parseSource(source: string) {
  const loader = new Loader();
  const parser = new Parser(await getDefinitions());
  const stream = Promise.resolve(bufferFromHex(source));
  const script = await loader.loadScript(stream);
  return await parser.parse(script);
}
