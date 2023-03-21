import { Graph } from '../graph';
import { IBasicBlock } from 'common/interfaces';
import { eBasicBlockType } from 'common/enums';

type G = Graph<IBasicBlock>;

describe(Graph.name, () => {
  let graph: G;
  const a: IBasicBlock = {
    type: eBasicBlockType.RETURN,
    instructions: [],
    start: 0,
  };
  const b: IBasicBlock = {
    type: eBasicBlockType.RETURN,
    instructions: [],
    start: 0,
  };
  const c: IBasicBlock = {
    type: eBasicBlockType.RETURN,
    instructions: [],
    start: 0,
  };

  beforeEach(() => {
    graph = new Graph<IBasicBlock>();
  });

  it('has nodes and edges', () => {
    expect(graph.nodes).toBeArray();
    expect(graph.edges).toBeArray();
  });

  it('has method addEdge', () => {
    expect(graph.edges).toBeArrayOfSize(0);
    graph.addEdge(a, b);
    expect(graph.edges).toBeArrayOfSize(1);
    expect(graph.edges[0]).toEqual({ from: a, to: b });
  });

  it('has root property', () => {
    expect(graph.root).toBeUndefined();
    graph.addNode(a, b);
    expect(graph.root).toBe(a);
  });

  it('has getImmPredecessors method', () => {
    expect(graph.getImmPredecessors(a)).toBeArrayOfSize(0);
    expect(graph.getImmPredecessors(b)).toBeArrayOfSize(0);
    graph.addEdge(a, b);
    expect(graph.getImmPredecessors(a)).toBeArrayOfSize(0);
    expect(graph.getImmPredecessors(b)).toEqual([a]);
  });

  it('has getImmSuccessors method', () => {
    expect(graph.getImmSuccessors(a)).toBeArrayOfSize(0);
    expect(graph.getImmSuccessors(b)).toBeArrayOfSize(0);
    graph.addEdge(a, b);
    expect(graph.getImmSuccessors(a)).toEqual([b]);
    expect(graph.getImmSuccessors(b)).toBeArrayOfSize(0);
  });

  it('has getNodeIndex method', () => {
    graph.addNode(a, b);
    expect(graph.getNodeIndex(a)).toEqual(0);
    expect(graph.getNodeIndex(b)).toEqual(1);
  });

  it('has property latchingNodes', () => {
    const i = new Graph();
    i.addNode(a, b, c);
    i.addEdge(a, b);
    i.addEdge(b, c);
    i.addEdge(c, a);
    expect(i.latchingNodes).toEqual([c]);
  });
});
