import * as _ from 'lodash';
import * as graphUtils from './graph-utils';
import Graph from './graph';
import { eLoopType } from 'common/enums';

export class LoopGraph<Node> extends Graph<Node> {
	type: eLoopType;
}

export function getLoopType<Node>(
	graph: Graph<Node>,
	loop: Graph<Node>,
	loopHeader: Node,
	latchingNode: Node
): eLoopType {
	const headerSuccessors = graph.getImmSuccessors(loopHeader);
	const latchingNodeSuccessors = graph.getImmSuccessors(latchingNode);

	if (latchingNodeSuccessors.length === 2) {
		if (headerSuccessors.length === 2) {
			if (loop.hasNode(headerSuccessors[0]) && loop.hasNode(headerSuccessors[1])) {
				return eLoopType.REPEAT;
			}
			return eLoopType.WHILE;
		}
		return eLoopType.REPEAT;
	}
	if (headerSuccessors.length === 2) {
		return eLoopType.WHILE;
	}
	return eLoopType.ENDLESS;
}

export function structure<Node>(graph: Graph<Node>): Graph<Node> {
	const intervals = graphUtils.split(graph);
	const reducibleInterval =_.find(intervals, 'hasLoop');

	if (reducibleInterval) {
		const latchingNode = reducibleInterval.latchingNodes[0];
		const loop = new LoopGraph<Node>();

		for (const node of reducibleInterval.nodes) {
			loop.addNode(node);
			if (node === latchingNode) {
				break;
			}
		}
		loop.type = getLoopType(graph, loop, reducibleInterval.root, latchingNode);
		return structure(
			graphUtils.replaceNodes(graph, reducibleInterval.root, latchingNode, loop) as Graph<Node>
		);
	}

	return graph;
}
