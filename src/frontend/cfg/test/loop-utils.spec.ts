import { eLoopType } from 'common/enums';
import { IBasicBlock } from 'common/interfaces';

import * as loopUtils from '../loop-utils';
import * as graphUtils from '../graph-utils';
import { complexGraph } from './graph.sample';
import { LoopGraph } from '../loop-utils';
import { GraphNode } from '../graph';

describe('Loop utils', () => {

	it('structure shall collapse nodes of the given graph into a single LoopGraph node', () => {
		const graph = graphUtils.reversePostOrder(complexGraph());
		const reduced = loopUtils.structure(graph);
		const loop1 = reduced.nodes[5] as LoopGraph<GraphNode<IBasicBlock>>;
		expect(loop1 instanceof LoopGraph).toBeTrue();
		const loop2 = loop1.nodes[2] as LoopGraph<GraphNode<IBasicBlock>>;
		expect(loop2 instanceof LoopGraph).toBeTrue();
	});

	it('getLoopType shall determine loop type based on input parameters', () => {
		const graph = graphUtils.reversePostOrder(complexGraph());
		const reduced = loopUtils.structure((graph));
		const loop1 = reduced.nodes[5] as LoopGraph<GraphNode<IBasicBlock>>;
		const loop2 = loop1.nodes[2] as LoopGraph<GraphNode<IBasicBlock>>;
		expect(loopUtils.getLoopType(graph, loop1, graph.nodes[5], graph.nodes[9])).toEqual(eLoopType.WHILE);
		expect(loopUtils.getLoopType(graph, loop2, graph.nodes[7], graph.nodes[8])).toEqual(eLoopType.REPEAT);
	});

});
