import { getDefinitions } from 'definitions';
import Loader from 'frontend/loader';
import Parser from 'frontend/parser';
import loop1 from 'samples/loop1';
import loop2 from 'samples/loop2';
import love2 from 'samples/love2';
import { bufferFromHex } from 'utils/file';
import ExpressionPrinter from 'utils/printer/ExpressionPrinter';
import CFG from '..';
import { print } from '../../../main';

[loop1, loop2, love2].forEach((sample, i) => {
  describe(`sample input ${i + 1}`, () => {
    // it('should produce a call graph', async () => {
    //   const scripts = await parseSource(loop1);
    //   const cfg = new CFG();
    //   const graph = cfg.getCallGraphs(scripts[0], scripts);

    //   expect(graph).toMatchSnapshot();
    // });

    it('should produce a decompiled source', async () => {
      const scripts = await parseSource(sample);
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
});

async function parseSource(source: string) {
  const loader = new Loader();
  const parser = new Parser(await getDefinitions());
  const stream = Promise.resolve(bufferFromHex(source));
  const script = await loader.loadScript(stream);
  return await parser.parse(script);
}
