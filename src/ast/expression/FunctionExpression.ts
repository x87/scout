import Expression from './Expression';

export default class FunctionExpression {
  body: Expression[];
  name: string;

  constructor(body: Expression[], name: string) {
    this.name = name;
    this.body = body;
  }
}
