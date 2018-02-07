import Graph from '../graph';
import { IBasicBlock } from 'common/interfaces';
import { eBasicBlockType } from 'common/enums';
import { complexGraph } from './graph.sample';
import * as graphUtils from '../graph-utils';

type G = Graph<IBasicBlock>;

describe(Graph.name, () => {

	let graph: G;
	const a: IBasicBlock = { type: eBasicBlockType.RETURN, instructions: [] };
	const b: IBasicBlock = { type: eBasicBlockType.RETURN, instructions: [] };
	const c: IBasicBlock = { type: eBasicBlockType.RETURN, instructions: [] };

	beforeEach(() => {
		graph = new Graph<IBasicBlock>();
	});

	it('has nodes and edges', () => {
		expect(graph.nodes).toBeArray();
		expect(graph.edges).toBeArray();
	});

	it('has method addEdge', () => {
		expect(graph.edges).toBeEmptyArray();
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
		expect(graph.getImmPredecessors(a)).toBeEmptyArray();
		expect(graph.getImmPredecessors(b)).toBeEmptyArray();
		graph.addEdge(a, b);
		expect(graph.getImmPredecessors(a)).toBeEmptyArray();
		expect(graph.getImmPredecessors(b)).toEqual([a]);
	});

	it('has getImmSuccessors method', () => {
		expect(graph.getImmSuccessors(a)).toBeEmptyArray();
		expect(graph.getImmSuccessors(b)).toBeEmptyArray();
		graph.addEdge(a, b);
		expect(graph.getImmSuccessors(a)).toEqual([b]);
		expect(graph.getImmSuccessors(b)).toBeEmptyArray();
	});

	it('has getNodeIndex method', () => {
		graph.addNode(a, b);
		expect(graph.getNodeIndex(a)).toEqual(0);
		expect(graph.getNodeIndex(b)).toEqual(1);
	});

	it('has findCommonSuccessor method', () => {
		graph.addEdge(a, c);
		graph.addEdge(b, c);
		expect(graph.findCommonSuccessor(a, b)).toEqual(c);
	});

	it('has property latchingNodes', () => {
		const i = new Graph();
		i.addNode(a, b, c);
		i.addEdge(a, b);
		i.addEdge(b, c);
		i.addEdge(c, a);
		expect(i.latchingNodes).toEqual([c]);
	});

	it('has hasLoop property', () => {
		const reduced = graphUtils.reduce(complexGraph());
		const i6 = reduced.nodes[0] as G;
		const i4: G = i6.nodes[0] as G;
		const i5: G = i6.nodes[1] as G;
		const i2: G = i5.nodes[0] as G;
		const i3: G = i5.nodes[1] as G;
		const i1: G = i4.nodes[0] as G;

		expect(i1.hasLoop).toBeFalse();
		expect(i2.hasLoop).toBeFalse();
		expect(i3.hasLoop).toBeTrue();
		expect(i4.hasLoop).toBeFalse();
		expect(i5.hasLoop).toBeTrue();
		expect(i6.hasLoop).toBeFalse();
	});

	it('has rootNode property', () => {
		const complex = complexGraph();
		const reduced = graphUtils.reduce(complex);
		const i6 = reduced.nodes[0] as G;
		const i4: G = i6.nodes[0] as G;
		const i5: G = i6.nodes[1] as G;
		const i2: G = i5.nodes[0] as G;
		const i3: G = i5.nodes[1] as G;
		const i1: G = i4.nodes[0] as G;

		expect(i1.rootNode).toBe(complex.nodes[0] as any);
		expect(i2.rootNode).toBe(complex.nodes[5] as any);
		expect(i3.rootNode).toBe(complex.nodes[12] as any);
		expect(i4.rootNode).toBe(complex.nodes[0] as any);
		expect(i5.rootNode).toBe(complex.nodes[5] as any);
		expect(i6.rootNode).toBe(complex.nodes[0] as any);
	});

});
