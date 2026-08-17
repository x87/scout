/// <reference types="jest" />

import { eScriptType } from 'common/enums';
import { IScript } from 'common/interfaces';
import { CFG } from '../cfg';

describe(CFG.name, () => {
  it('returns empty call graph list for an empty script', () => {
    const cfg = new CFG();
    const script: IScript = {
      name: 'EMPTY',
      type: eScriptType.CLEO,
      instructionMap: new Map(),
    };

    expect(() => cfg.getCallGraphs(script, [script])).not.toThrow();
    expect(cfg.getCallGraphs(script, [script])).toEqual([]);
  });

  it('does not crash when the last block is fall-through', () => {
    const cfg = new CFG();
    const script: IScript = {
      name: 'ONE',
      type: eScriptType.CLEO,
      instructionMap: new Map([
        [
          0,
          {
            opcode: 0x0001,
            offset: 0,
            params: [],
          },
        ],
      ]),
    };

    expect(() => cfg.getCallGraphs(script, [script])).not.toThrow();
    const graphs = cfg.getCallGraphs(script, [script]);
    expect(graphs).toBeArrayOfSize(1);
    expect(graphs[0].nodes).toBeArrayOfSize(1);
  });
});
