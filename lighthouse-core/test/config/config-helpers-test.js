/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const helpers = require('../../config/config-helpers.js');
const Gatherer = require('../../gather/gatherers/gatherer.js');
const UserTimingsAudit = require('../../audits/user-timings.js');

/* eslint-env jest */

describe('.deepClone', () => {
  it('should clone things deeply', () => {
    const input = {a: {b: {c: 1}}};
    const output = helpers.deepClone(input);
    expect(output).not.toBe(input);
    expect(output).toEqual(input);
    output.a.b.c = 2;
    expect(input.a.b.c).toEqual(1);
  });
});

describe('.deepCloneConfigJson', () => {
  it('should clone a config deeply', () => {
    const TimingGatherer = new Gatherer();
    const input = {
      artifacts: [{id: 'Timing', gatherer: TimingGatherer}],
      passes: [{passName: 'defaultPass', gatherers: []}],
      audits: [{path: 'user-timings'}],
      categories: {random: {auditRefs: [{id: 'user-timings'}]}},
    };

    const output = helpers.deepCloneConfigJson(input);
    expect(output).not.toBe(input);
    expect(output).toEqual(input);
    output.artifacts[0].id = 'NewName';
    output.passes[0].passName = 'newName';
    output.audits[0].path = 'new-audit';
    output.categories.random.auditRefs[0].id = 'new-audit';
    expect(input.artifacts[0].id).toEqual('Timing');
    expect(input.passes[0].passName).toEqual('defaultPass');
    expect(input.audits[0].path).toEqual('user-timings');
    expect(input.categories.random.auditRefs[0].id).toEqual('user-timings');
  });

  it('should preserve gatherer implementations in passes', () => {
    const TimingGatherer = new Gatherer();
    const input = {
      passes: [{passName: 'defaultPass', gatherers: [TimingGatherer]}],
    };

    const output = helpers.deepCloneConfigJson(input);
    expect(output.passes[0].gatherers[0]).toEqual(TimingGatherer);
  });

  it('should preserve gatherer implementations in artifacts', () => {
    const TimingGatherer = new Gatherer();
    const input = {
      artifacts: [{id: 'Timing', gatherer: TimingGatherer}],
    };

    const output = helpers.deepCloneConfigJson(input);
    expect(output.artifacts[0].gatherer).toEqual(TimingGatherer);
  });

  it('should preserve audit implementations', () => {
    const input = {
      audits: [{implementation: UserTimingsAudit}],
    };

    const output = helpers.deepCloneConfigJson(input);
    expect(output.audits[0].implementation).toEqual(UserTimingsAudit);
  });
});


describe('.requireAudits', () => {
  it('should expand audit short-hand', () => {
    const result = helpers.requireAudits(['user-timings']);

    expect(result).toEqual([{path: 'user-timings', options: {}, implementation: UserTimingsAudit}]);
  });

  it('should handle multiple audit definition styles', () => {
    const result = helpers.requireAudits(['user-timings', {implementation: UserTimingsAudit}]);

    expect(result).toMatchObject([{path: 'user-timings'}, {implementation: UserTimingsAudit}]);
  });

  it('should merge audit options', () => {
    const audits = [
      'user-timings',
      {path: 'is-on-https', options: {x: 1, y: 1}},
      {path: 'is-on-https', options: {x: 2}},
    ];
    const merged = helpers.requireAudits(audits);
    expect(merged).toMatchObject([
      {path: 'user-timings', options: {}},
      {path: 'is-on-https', options: {x: 2, y: 1}},
    ]);
  });

  it('throws for invalid auditDefns', () => {
    expect(() => helpers.requireAudits([new Gatherer()])).toThrow(/Invalid Audit type/);
  });
});
