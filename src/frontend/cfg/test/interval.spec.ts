import Graph from '../graph';
import { IBasicBlock } from 'common/interfaces';
import Interval, { findIntervals } from '../interval';
import { eBasicBlockType } from 'common/enums';

describe(Interval.name, () => {
	let graph: Graph<IBasicBlock>;
	const a: IBasicBlock = { type: eBasicBlockType.UNDEFINED, instructions: [] };
	const b: IBasicBlock = { type: eBasicBlockType.RETURN, instructions: [] };
	const c: IBasicBlock = { type: eBasicBlockType.ONE_WAY, instructions: [] };
	const d: IBasicBlock = { type: eBasicBlockType.TWO_WAY, instructions: [] };
	const e: IBasicBlock = { type: eBasicBlockType.FALL, instructions: [] };
	const f: IBasicBlock = { type: eBasicBlockType.CALL, instructions: []	};

	beforeEach(() => {
		graph = new Graph<IBasicBlock>();
	});

	it('findIntervals shall return empty array for the empty graph', () => {
		expect(findIntervals(graph)).toEqual([]);
	});

	it('findIntervals shall correctly split a given graph onto a set of disjoint graphs', () => {
		graph.addNode(a, f, d, c, b, e);
		graph.addEdge(a, b);
		graph.addEdge(b, c);
		graph.addEdge(c, d);
		graph.addEdge(d, b);
		graph.addEdge(b, e);
		graph.addEdge(e, f);
		graph.addEdge(e, a);

		const i1 = new Interval<IBasicBlock>();
		i1.addNode(a);
		i1.addEdge(a, b);
		i1.addEdge(e, a);

		const i2 = new Interval<IBasicBlock>();
		i2.addNode(b, c, e, f, d);

		i2.addEdge(b, c);
		i2.addEdge(b, e);
		i2.addEdge(a, b);
		i2.addEdge(d, b);
		i2.addEdge(c, d);
		i2.addEdge(e, f);
		i2.addEdge(e, a);

		const intervals = [ i1, i2 ];
		expect(findIntervals(graph)).toEqual(intervals);
	});

	it('has property latchingNodes', () => {
		const i = new Interval();
		i.addNode(a, b, c);
		i.addEdge(a, b);
		i.addEdge(b, c);
		i.addEdge(c, a);
		expect(i.latchingNodes).toEqual([c]);
	});
});
