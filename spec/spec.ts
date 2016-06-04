/// <reference path='../src/import.ts'/>
/// <reference path='../typings/jasmine/jasmine.d.ts'/>
/// <reference path='specs/defined.spec.ts'/>
/// <reference path='specs/LoaderTest.spec.ts'/>
/// <reference path='specs/helpersTest.spec.ts'/>
/// <reference path='specs/LogTest.spec.ts'/>

namespace scout.test {
    describe('test global definitions', defined);
    describe('test Loader class', LoaderTest);
    describe('test helpers', helpersTest);
    describe('test Log', LogTest);
}
