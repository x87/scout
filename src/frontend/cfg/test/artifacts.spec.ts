import { getDefinitions } from 'definitions';
import { Loader } from 'frontend/loader';
import { Parser } from 'frontend/parser';
import loop3 from 'samples/loop3';
import loop4 from 'samples/loop4';
import wrong1 from 'samples/wrong';
import yard2 from 'samples/yard2';
import { bufferFromHex } from 'utils/file';
import { ExpressionPrinter } from 'utils/printer/ExpressionPrinter';
import { CFG } from '../cfg';
import { print } from '../../../main';

[loop3, loop4].forEach((sample, i) =>
  describe(`sample input ${i + 1}`, () => {
    it(`has redundant 'continue' statements`, async () => {
      expect(await decompile(sample)).toMatchSnapshot();
    });
  })
);

describe(`wrong 1`, () => {
  it(`loses an unreachable node`, async () => {
    expect(await decompile(wrong1)).toMatchSnapshot();
  });
});

describe(`yard 2`, () => {
  it(`duplicates M_FAIL block`, async () => {
    expect(await decompile(yard2)).toMatchSnapshot();
  });
});

async function decompile(source) {
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
