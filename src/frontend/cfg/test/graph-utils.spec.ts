import { Graph } from '../graph';
import * as graphUtils from '../graph-utils';
import { complexGraph, endlessLoop } from './graph.sample';
import { IBasicBlock } from 'common/interfaces';
import { eBasicBlockType } from 'common/enums';

type G = Graph<IBasicBlock>;

describe('Graph utils', () => {
  let graph: G;
  const a: IBasicBlock = { type: eBasicBlockType.UNDEFINED, instructions: [] };
  const b: IBasicBlock = { type: eBasicBlockType.RETURN, instructions: [] };
  const c: IBasicBlock = { type: eBasicBlockType.ONE_WAY, instructions: [] };
  const d: IBasicBlock = { type: eBasicBlockType.TWO_WAY, instructions: [] };
  const e: IBasicBlock = { type: eBasicBlockType.FALL, instructions: [] };
  const f: IBasicBlock = { type: eBasicBlockType.FALL, instructions: [] };

  beforeEach(() => {
    graph = new Graph<IBasicBlock>();
  });

  it('split shall return empty array for the empty graph', () => {
    expect(graphUtils.split(graph)).toEqual([]);
  });

  it('split shall correctly split a given graph onto a set of disjoint graphs', () => {
    graph.addNode(a, b, c, d, e, f);
    graph.addEdge(a, b);
    graph.addEdge(b, c);
    graph.addEdge(c, d);
    graph.addEdge(d, b);
    graph.addEdge(b, e);
    graph.addEdge(e, f);
    graph.addEdge(e, a);

    const i1 = new Graph<IBasicBlock>();
    i1.addNode(a);
    i1.addEdge(a, b);
    i1.addEdge(e, a);

    const i2 = new Graph<IBasicBlock>();
    i2.addNode(b, c, d, e, f);

    i2.addEdge(b, c);
    i2.addEdge(b, e);
    i2.addEdge(a, b);
    i2.addEdge(d, b);
    i2.addEdge(c, d);
    i2.addEdge(e, f);
    i2.addEdge(e, a);

    const intervals = [i1, i2];
    expect(graphUtils.split(graph)).toEqual(intervals);
  });

  it('from shall create a new graph with same nodes and edges as in the given graph', () => {
    graph.addNode(a, f, d, c, b, e);
    graph.addEdge(a, b);
    graph.addEdge(b, c);
    graph.addEdge(c, d);
    graph.addEdge(d, b);
    graph.addEdge(b, e);
    graph.addEdge(e, f);
    graph.addEdge(e, a);
    const copy = graphUtils.from(graph);
    expect(copy.nodes).toEqual(graph.nodes);
    expect(copy.edges).toEqual(graph.edges);
  });

  it(`findDom shall return an array of arrays of nodes that
		dominate each node in the given graph (including the node itself)`, () => {
    const rpoGraph = graphUtils.reversePostOrder(complexGraph());
    const dom = graphUtils.findDom(rpoGraph);
    expect(dom).toBeArrayOfSize(rpoGraph.nodes.length);
    expect(dom[0]).toBeArrayOfSize(1);
    expect(dom[0]).toEqual([rpoGraph.root]);
    expect(dom[1]).toBeArrayOfSize(2);
    expect(dom[1]).toContain(rpoGraph.nodes[0]);
    expect(dom[1]).toContain(rpoGraph.nodes[1]);
    expect(dom[14]).toBeArrayOfSize(6);
    expect(dom[14]).toContain(rpoGraph.nodes[14]);
  });

  it(`findSDom shall return an array of arrays of nodes that
		dominate each node in the given graph (excluding the node itself)`, () => {
    const rpoGraph = graphUtils.reversePostOrder(complexGraph());
    const sdom = graphUtils.findSDom(rpoGraph);
    expect(sdom).toBeArrayOfSize(rpoGraph.nodes.length);
    expect(sdom[0]).toBeArrayOfSize(0);
    expect(sdom[1]).toBeArrayOfSize(1);
    expect(sdom[1]).toContain(rpoGraph.nodes[0]);
    expect(sdom[14]).toBeArrayOfSize(5);
    expect(sdom[14]).not.toContain(rpoGraph.nodes[14]);
  });

  it(`findIDom shall return an array of nodes that
		immediately dominate each node in the given graph`, () => {
    const rpoGraph = graphUtils.reversePostOrder(complexGraph());
    const idom = graphUtils.findIDom(rpoGraph);
    expect(idom).toBeArrayOfSize(rpoGraph.nodes.length);
    expect(idom[0]).toBeUndefined();
    expect(idom[1]).toBe(rpoGraph.nodes[0]);
    expect(idom[4]).toBe(rpoGraph.nodes[0]);
    expect(idom[5]).toBe(rpoGraph.nodes[4]);
  });

  it('should produce the post-dominator matrix for a given graph', () => {
    const rpoGraph = graphUtils.reversePostOrder(complexGraph());
    const pdom = graphUtils.findPDom(rpoGraph);

    expect(pdom).toBeArrayOfSize(rpoGraph.nodes.length);

    expect(pdom[0]).toEqual([
      rpoGraph.nodes[0], // B1
      rpoGraph.nodes[4], // B5
      rpoGraph.nodes[5], // B6
      rpoGraph.nodes[10], // B7
      rpoGraph.nodes[13], // B10
      rpoGraph.nodes[14], // B11
    ]);
    expect(pdom[14]).toEqual([rpoGraph.nodes[14]]); // B11

    const endless = endlessLoop();
    const pd = graphUtils.findPDom(endless);
    const [n1, n2, n3, n4, n5] = endless.nodes;
    expect(pd).toEqual([[n1, n2, n4, n5], [n2, n4, n5], [n3, n4, n5], [n4, n5], [n5]]);
  });

  it('should transpose a given graph', () => {
    const endless = endlessLoop();
    const [n1, n2, n3, n4, n5] = endless.nodes;
    const transposed = graphUtils.transpose(endless);
    expect(transposed.nodes).toEqual([n5, n4, n3, n2, n1]);
    expect(transposed.edges).toEqual([
      { from: n1, to: n5 },
      { from: n5, to: n4 },
      { from: n4, to: n3 },
      { from: n3, to: n2 },
      { from: n4, to: n2 },
      { from: n2, to: n1 },
    ]);
  });
});
