import Graph from '../graph';
import * as graphUtils from '../graph-utils';
import {
  complexGraph,
  endlessLoop,
  graph1,
  graph2,
  graph3,
  graph4,
} from './graph.sample';
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

  it('replaceNodes shall replace given nodes in the given graph with a new given node', () => {
    graph.addNode(a, b, c, d, e, f);
    graph.addEdge(a, b);
    graph.addEdge(b, c);
    graph.addEdge(c, d);
    graph.addEdge(d, b);
    graph.addEdge(b, e);
    graph.addEdge(e, f);
    graph.addEdge(e, a);

    const node = new Graph();
    const newGraph = graphUtils.replaceNodes(graph, b, d, node);
    expect(graph.nodes.length).toEqual(6);
    expect(newGraph.nodes.length).toEqual(4);
    expect(newGraph.hasNode(node)).toBeTrue();
    const prev = newGraph.getImmPredecessors(node);
    const next = newGraph.getImmSuccessors(node);
    expect(prev).toEqual([a]);
    expect(next).toEqual([e]);
  });

  it(`findDom shall return an array of arrays of nodes that
		dominate each node in the given graph (including the node itself)`, () => {
    const rpoGraph = graphUtils.reversePostOrder(complexGraph());
    const dom = graphUtils.findDom(rpoGraph);
    expect(dom).toBeArrayOfSize(rpoGraph.nodes.length);
    expect(dom[0]).toBeArrayOfSize(1);
    expect(dom[0]).toEqual([rpoGraph.root] as number[]);
    expect(dom[1]).toBeArrayOfSize(2);
    expect(dom[1]).toContain(rpoGraph.nodes[0] as number);
    expect(dom[1]).toContain(rpoGraph.nodes[1] as number);
    expect(dom[14]).toBeArrayOfSize(6);
    expect(dom[14]).toContain(rpoGraph.nodes[14] as number);
  });

  it(`findSDom shall return an array of arrays of nodes that
		dominate each node in the given graph (excluding the node itself)`, () => {
    const rpoGraph = graphUtils.reversePostOrder(complexGraph());
    const sdom = graphUtils.findSDom(rpoGraph);
    expect(sdom).toBeArrayOfSize(rpoGraph.nodes.length);
    expect(sdom[0]).toBeArrayOfSize(0);
    expect(sdom[1]).toBeArrayOfSize(1);
    expect(sdom[1]).toContain(rpoGraph.nodes[0] as number);
    expect(sdom[14]).toBeArrayOfSize(5);
    expect(sdom[14]).not.toContain(rpoGraph.nodes[14] as number);
  });

  it(`findIDom shall return an array of nodes that
		immediately dominate each node in the given graph`, () => {
    const rpoGraph = graphUtils.reversePostOrder(complexGraph());
    const idom = graphUtils.findIDom(rpoGraph);
    expect(idom).toBeArrayOfSize(rpoGraph.nodes.length);
    expect(idom[0]).toBeUndefined();
    expect(idom[1]).toBe(rpoGraph.nodes[0] as number);
    expect(idom[4]).toBe(rpoGraph.nodes[0] as number);
    expect(idom[5]).toBe(rpoGraph.nodes[4] as number);
  });

  it('should produce the post-dominator matrix for a given graph', () => {
    const rpoGraph = graphUtils.reversePostOrder(complexGraph());
    const pdom = graphUtils.findPDom(rpoGraph);

    expect(pdom).toBeArrayOfSize(rpoGraph.nodes.length);

    expect(pdom[0]).toEqual([
      1, // B1
      5, // B5
      6, // B6
      7, // B7
      10, // B10
      11, // B11
    ]);
    expect(pdom[14]).toEqual([11]); // B11

    const pd = graphUtils.findPDom(endlessLoop());
    expect(pd).toEqual([[1, 2, 4, 5], [2, 4, 5], [3, 4, 5], [4, 5], [5]]);
  });

  it('should produce immediate post-dominators list', () => {
    const g1 = graph1();
    const idom1 = graphUtils.findIPDom(g1);
    expect(idom1).toEqual([2, 5, 4, 1, undefined]);

    const g2 = graph2();
    const idom2 = graphUtils.findIPDom(g2);
    expect(idom2).toEqual([2, 3, undefined]);

    const g3 = graph3();
    const idom3 = graphUtils.findIPDom(g3);
    expect(idom3).toEqual([5, 5, 5, 3, undefined]);
  });

  it('should reverse a given graph', () => {
    const g = graph3();
    const reversed = graphUtils.reverse(g);
    expect(reversed.nodes).toEqual(g.nodes);
    g.edges.forEach((edge, i) => {
      expect(edge.from).toBe(reversed.edges[i].to);
      expect(edge.to).toBe(reversed.edges[i].from);
    });
    expect(reversed.root).toBe(g.nodes[4]);
  });

  it('should calculate post-dominators using simple-fast algorithm', () => {
    const g = graph4();
    const dom = graphUtils.findIDom(g);
    expect(dom).toEqual([
      undefined,
      0,
      1,
      2,
      2,
      4,
      5,
      5,
      3,
      8,
      9,
      9,
      11,
      12,
      12,
      2,
    ]);

    const reversed = graphUtils.reverse(g);
    const idom = graphUtils.findIDom(reversed);
    expect(idom).toEqual([
      1,
      2,
      15,
      8,
      5,
      15,
      15,
      1,
      9,
      15,
      15,
      12,
      15,
      15,
      8,
      undefined,
    ]);

    const ipdom = graphUtils.findIPDom(g);
    expect(ipdom).toEqual([
      1,
      2,
      15,
      8,
      5,
      15,
      15,
      1,
      9,
      15,
      15,
      12,
      15,
      15,
      8,
      undefined,
    ]);
  });
});
