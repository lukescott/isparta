//

import {expect} from 'chai'

import {getFixturesTest, extractCodeExpect} from './_helpers.js';

import {Instrumenter, Reporter} from '../src/isparta';

describe('Isparta instrumenter', function () {

  before(function () {
    this.instrumenter = new Instrumenter();
  });

  getFixturesTest().map(({name, actual, expect: expected}) => {

    describe(`when ${name}`, function () {

      before(function (done) {

        this.instrumenter.instrument(actual.code, actual.loc, (err) => {
          if (err) { throw err; }

          let {statementMap, fnMap, branchMap} = this.instrumenter.coverState;

          this.statementMap = values(statementMap);
          this.functionMap = values(fnMap);
          this.branchMap = values(branchMap);

          done();
        });

        function values(arr) { return Object.keys(arr).map(key => arr[key] || {}); }

      });

      [
        { name: 'statement' },
        { name: 'function', getLocation: (fn) => [fn.loc] },
        { name: 'branch', getLocation: (br) => br.locations }
      ].forEach(function (map) {
        let mapKey = `${map.name}Map`;
        map.getLocation = map.getLocation || (loc) => [loc];


        it(`should localize the ${map.name}s`, function () {
          this.current = { mapKey, ...map };
          this[mapKey].forEach((loc, i) => {
            this.current.loc = loc;
            this.current.i = i;
            expect(loc, `Expect the ${i}-th ${map.name}s to be deeply equal.`)
              .to.eql(expected.code[mapKey][i] || {});
          });

          this.current = null;
        });
      });

      afterEach(function () {
        if (!this.current ) {
          return;
        }
        console.log(this.current);
        var codeLines = actual.code.split('\n');
        //console.log('expected')
        //console.log('mapKey', this.mapKey)
        //console.log(expected.code[mapKey])
        this.current
          .getLocation(expected.code[this.current.mapKey][this.current.i])
          .forEach((loc) => {
            let expectCode = extractCodeExpect(codeLines, loc);
            let actualCode = extractCodeExpect(codeLines, loc);

            expect(actualCode, `Expect the ${this.current.i}-th ${this.current.name} to cover the same code snippet.`)
              .to.equal(expectCode);
          })
        ;

      });

    })

  })
});
