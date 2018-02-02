import Graph from '../graph';
import * as loopUtils from '../loop-utils';
import * as graphUtils from '../graph-utils';
import { complexGraph } from './graph.sample';
import { IBasicBlock } from 'common/interfaces';
import { eLoopType } from 'common/enums';

type G = Graph<IBasicBlock>;

describe('Loop utils', () => {

	it('findLoop should return an instance of LoopGraph in the given graph contains a loop', () => {
		const graph = complexGraph();
		const reduced = graphUtils.reduce(graph);

		const i6 = reduced.nodes[0] as G;
		const i4: G = i6.nodes[0] as G;
		const i5: G = i6.nodes[1] as G;
		const i2: G = i5.nodes[0] as G;
		const i3: G = i5.nodes[1] as G;
		const i1: G = i4.nodes[0] as G;

		const loop1 = loopUtils.findLoop(i3, graph);
		const loop2 = loopUtils.findLoop(i5, graph);
		expect(loopUtils.findLoop(i1, graph)).toBeNull();
		expect(loopUtils.findLoop(i2, graph)).toBeNull();
		expect(loop1.nodes).toEqual([i3.nodes[0], i3.nodes[1]]);
		expect(loop1.type).toEqual(eLoopType.REPEAT);
		expect(loopUtils.findLoop(i4, graph)).toBeNull();
		expect(loop2.nodes).toEqual([i2, i3]);
		expect(loop2.type).toEqual(eLoopType.WHILE);
		expect(loopUtils.findLoop(i6, graph)).toBeNull();
	});

});
