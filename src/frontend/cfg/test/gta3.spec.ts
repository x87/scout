import { getDefinitions } from 'definitions';
import { Loader } from 'frontend/loader';
import { Parser } from 'frontend/parser';
import gta3 from 'samples/gta3_scm';
import { bufferFromHex } from 'utils/file';
import { ExpressionPrinter } from 'utils/printer/ExpressionPrinter';
import { CFG } from '../cfg';
import { print } from '../../../main';

describe(`gta3 scm`, () => {
  it('should produce a decompiled source', async () => {
    const scripts = await parseSource(gta3);
    const cfg = new CFG();
    const graph = cfg.getCallGraphs(scripts[0], scripts);

    let result = '';
    const printer = new ExpressionPrinter(await getDefinitions());
    jest.spyOn(printer, 'printLine').mockImplementation((line) => {
      result += printer.indentation + line + '\n';
    });

    print(graph, printer, scripts[0]);

    expect(result).toMatchSnapshot();
  });
});

async function parseSource(source: string) {
  const loader = new Loader();
  const parser = new Parser(await getDefinitions());
  const stream = Promise.resolve(bufferFromHex(source));
  const script = await loader.loadScript(stream);
  return await parser.parse(script);
}
