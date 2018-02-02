import Graph from '../graph';
import * as graphUtils from '../graph-utils';
import { complexGraph } from './graph.sample';
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
	const f: IBasicBlock = { type: eBasicBlockType.CALL, instructions: []	};

	beforeEach(() => {
		graph = new Graph<IBasicBlock>();
	});

	it('split shall return empty array for the empty graph', () => {
		expect(graphUtils.split(graph)).toEqual([]);
	});

	it('split shall correctly split a given graph onto a set of disjoint graphs', () => {
		graph.addNode(a, f, d, c, b, e);
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
		i2.addNode(b, c, e, f, d);

		i2.addEdge(b, c);
		i2.addEdge(b, e);
		i2.addEdge(a, b);
		i2.addEdge(d, b);
		i2.addEdge(c, d);
		i2.addEdge(e, f);
		i2.addEdge(e, a);

		const intervals = [ i1, i2 ];
		expect(graphUtils.split(graph)).toEqual(intervals);
	});

	it('reduce shall produce a graph with nodes being intervals in the given graph (1)', () => {
		graph.addNode(a, f, d, c, b, e);
		graph.addEdge(a, b);
		graph.addEdge(b, c);
		graph.addEdge(c, d);
		graph.addEdge(d, b);
		graph.addEdge(b, e);
		graph.addEdge(e, f);
		graph.addEdge(e, a);

		const reduced = graphUtils.reduce(graph);
		expect(reduced.nodes.length).toBe(1);
		expect(((reduced.root as G).root as G).root).toBe(a);
	});

	it('reduce shall produce a graph with nodes being intervals in the given graph (2)', () => {
		const reduced = graphUtils.reduce(complexGraph());
		const i6 = reduced.nodes[0] as G;
		const i4: G = i6.nodes[0] as G;
		const i5: G = i6.nodes[1] as G;
		const i2: G = i5.nodes[0] as G;
		const i3: G = i5.nodes[1] as G;
		const i1: G = i4.nodes[0] as G;

		expect(reduced.nodes.length).toBe(1);
		expect(i6.nodes.length).toBe(2);
		expect(i5.nodes.length).toBe(2);
		expect(i4.nodes.length).toBe(1);
		expect(i3.nodes.length).toBe(3);
		expect(i2.nodes.length).toBe(7);
		expect(i1.nodes.length).toBe(5);
	});

	it('reduce shall stop when graph is not reducible anymore', () => {
		const irreducible: Graph<IBasicBlock> = new Graph<IBasicBlock>();
		irreducible.addNode(a, b, c);
		irreducible.addEdge(a, b);
		irreducible.addEdge(a, c);
		irreducible.addEdge(b, c);
		irreducible.addEdge(c, b);
		expect(graphUtils.reduce(irreducible).nodes.length).toBe(3);
	});

});
