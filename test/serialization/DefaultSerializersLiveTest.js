/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const expect = require('chai').expect;
const RC = require('../RC');
const { Client, RestValue } = require('../../');

describe('DefaultSerializersLiveTest', function () {

    let cluster, client;
    let map;

    before(async function () {
        return RC.createCluster(null, null).then(function (res) {
            cluster = res;
        }).then(function () {
            return RC.startMember(cluster.id);
        }).then(function () {
            return Client.newHazelcastClient({ clusterName: cluster.id });
        }).then(function (cl) {
            client = cl;
            return client.getMap('test').then(function (mp) {
                map = mp;
            });
        });
    });

    after(async function () {
        client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    function generateGet(key) {
        return 'var StringArray = Java.type("java.lang.String[]");' +
            'function foo() {' +
            '   var map = instance_0.getMap("' + map.getName() + '");' +
            '   var res = map.get("' + key + '");' +
            '   if (res.getClass().isArray()) {' +
            '       return Java.from(res);' +
            '   } else {' +
            '       return res;' +
            '   }' +
            '}' +
            'result = ""+foo();'
    }

    it('string', async function () {
        await map.put('testStringKey', 'testStringValue');
        const response = await RC.executeOnController(cluster.id, generateGet('testStringKey'), 1);
        expect(response.result.toString()).to.equal('testStringValue');
    });

    it('utf8 sample string test', async function () {
        await map.put('key', 'Iñtërnâtiônàlizætiøn');
        const response = await RC.executeOnController(cluster.id, generateGet('key'), 1);
        expect(response.result.toString()).to.equal('Iñtërnâtiônàlizætiøn');
    });

    it('number', async function () {
        await map.put('a', 23);
        const response = await RC.executeOnController(cluster.id, generateGet('a'), 1);
        expect(Number.parseInt(response.result.toString())).to.equal(23);
    });

    it('array', async function () {
        await map.put('a', ['a', 'v', 'vg']);
        const response = await RC.executeOnController(cluster.id, generateGet('a'), 1);
        expect(response.result.toString()).to.equal(['a', 'v', 'vg'].toString());
    });

    it('buffer on client', async function () {
        await map.put('foo', Buffer.from('bar'));
        const response = await map.get('foo');
        expect(Buffer.isBuffer(response)).to.be.true;
        expect(response.toString()).to.equal('bar');
    });

    it('emoji string test on client', async function () {
        await map.put('key', '1⚐中💦2😭‍🙆😔5');
        const response = await map.get('key');
        expect(response).to.equal('1⚐中💦2😭‍🙆😔5');
    });

    it('utf8 characters test on client', async function () {
        await map.put('key', '\u0040\u0041\u01DF\u06A0\u12E0\u{1D306}');
        const response = await map.get('key');
        expect(response).to.equal('\u0040\u0041\u01DF\u06A0\u12E0\u{1D306}');
    });

    it('utf8 characters test on client with surrogates', async function () {
        await map.put('key', '\u0040\u0041\u01DF\u06A0\u12E0\uD834\uDF06');
        const response = await map.get('key');
        expect(response).to.equal('\u0040\u0041\u01DF\u06A0\u12E0\u{1D306}');
    });

    it('emoji string test on RC', async function () {
        await map.put('key', '1⚐中💦2😭‍🙆😔5');
        const response = await RC.executeOnController(cluster.id, generateGet('key'), 1);
        expect(response.result.toString()).to.equal('1⚐中💦2😭‍🙆😔5');
    });

    it('utf8 characters test on RC', async function () {
        await map.put('key', '\u0040\u0041\u01DF\u06A0\u12E0\u{1D306}');
        const response = await RC.executeOnController(cluster.id, generateGet('key'), 1);
        expect(response.result.toString()).to.equal('\u0040\u0041\u01DF\u06A0\u12E0\u{1D306}');
    });

    it('utf8 characters test on RC with surrogates', async function () {
        await map.put('key', '\u0040\u0041\u01DF\u06A0\u12E0\uD834\uDF06');
        const response = await RC.executeOnController(cluster.id, generateGet('key'), 1);
        expect(response.result.toString()).to.equal('\u0040\u0041\u01DF\u06A0\u12E0\u{1D306}');
    });

    it('rest value', async function () {
        // Make sure that the object is properly de-serialized at the server
        const restValue = new RestValue();
        restValue.value = '{\'test\':\'data\'}';
        restValue.contentType = 'text/plain';

        const script = 'var map = instance_0.getMap("' + map.getName() + '");\n' +
            'var restValue = map.get("key");\n' +
            'var contentType = restValue.getContentType();\n' +
            'var value = restValue.getValue();\n' +
            'var String = Java.type("java.lang.String");\n' +
            'result = "{\\"contentType\\": \\"" + new String(contentType) + "\\", ' +
            '\\"value\\": \\"" +  new String(value) + "\\"}"\n';

        await map.put('key', restValue);
        const response = await RC.executeOnController(cluster.id, script, 1);
        const result = JSON.parse(response.result.toString());
        expect(result.contentType).to.equal(restValue.contentType);
        expect(result.value).to.equal(restValue.value);
    });
});
