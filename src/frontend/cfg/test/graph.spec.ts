import Graph from '../graph';
import { IBasicBlock } from 'common/interfaces';
import { eBasicBlockType } from 'common/enums';

describe(Graph.name, () => {

	let graph: Graph<IBasicBlock>;
	const a: IBasicBlock = {
		type: eBasicBlockType.RETURN,
		instructions: []
	};
	const b: IBasicBlock = {
		type: eBasicBlockType.RETURN,
		instructions: []
	};
	const c: IBasicBlock = {
		type: eBasicBlockType.RETURN,
		instructions: []
	};

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

});
