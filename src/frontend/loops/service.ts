import Log from 'utils/log';
import AppError from 'common/errors';

import { IBasicBlock } from 'common/interfaces';
import { eBasicBlockType, eLoopType } from 'common/enums';

export default class LoopService {

	static findLoopType(head: IBasicBlock, latchingNode: IBasicBlock): eLoopType {
		if (head.type === eBasicBlockType.TWO_WAY && latchingNode.type !== eBasicBlockType.TWO_WAY) {
			return eLoopType.WHILE;
		}

		if (latchingNode.type === eBasicBlockType.TWO_WAY) {
			return eLoopType.REPEAT;
		}

		if (latchingNode.type === eBasicBlockType.ONE_WAY) {
			return eLoopType.ENDLESS;
		}

		Log.warn(AppError.UNKNOWN_LOOP_TYPE, head.type, latchingNode.type);
		return eLoopType.NONE;
	}
}
