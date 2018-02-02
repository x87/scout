import Log from 'utils/log';
import AppError from 'common/errors';
import Graph from './graph';

import { eLoopType } from 'common/enums';

class LoopGraph<Node> extends Graph<Node> {
	originalGraph: Graph<Node>;

	get type(): eLoopType {
		const headerSuccessors = this.getImmSuccessors(this.root);
		const latchingNodeSuccessors = this.getImmSuccessors(this.latchingNodes[0]);

		if (headerSuccessors.length === 2 && latchingNodeSuccessors.length === 1) {
			return eLoopType.WHILE;
		}

		if (latchingNodeSuccessors.length === 2) {
			return eLoopType.REPEAT;
		}

		if (latchingNodeSuccessors.length === 1) {
			return eLoopType.ENDLESS;
		}

		Log.warn(AppError.UNKNOWN_LOOP_TYPE, headerSuccessors.length, latchingNodeSuccessors.length);

		return eLoopType.NONE;
	}
}

export function findLoop<Node>(interval: Graph<Node>, graph: Graph<Node>): LoopGraph<Node> | null {

	if (!interval.hasLoop) return null;
	const loop = new LoopGraph<Node>();
	loop.originalGraph = graph;

	const loopHeadIndex = interval.getNodeIndex(interval.root);
	const loopEndIndex = interval.getNodeIndex(interval.latchingNodes[0]);

	for (const node of interval.nodes) {
		const nodeIndex = interval.getNodeIndex(node);
		if (nodeIndex >= loopHeadIndex && nodeIndex <= loopEndIndex) {
			loop.addNode(node);
		}
	}

	return loop;
}
