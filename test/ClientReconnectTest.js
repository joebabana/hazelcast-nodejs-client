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
const RC = require('./RC');
const { Client } = require('../.');

describe('ClientReconnectTest', function () {

    let cluster, client;

    afterEach(function () {
        client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('member restarts, while map.put in progress', function () {
        this.timeout(9000);
        let member, map;
        return RC.createCluster(null, null).then(function (cl) {
            cluster = cl;
            return RC.startMember(cluster.id);
        }).then(function (m) {
            member = m;
            return Client.newHazelcastClient({
                clusterName: cluster.id,
                properties: {
                    'hazelcast.client.heartbeat.interval': 1000,
                    'hazelcast.client.heartbeat.timeout': 3000
                }
            });
        }).then(function (cl) {
            client = cl;
            return client.getMap('test');
        }).then(function (mp) {
            map = mp;
            return RC.terminateMember(cluster.id, member.uuid);
        }).then(function () {
            return RC.startMember(cluster.id);
        }).then(function () {
            return map.put('testkey', 'testvalue');
        }).then(function () {
            return map.get('testkey');
        }).then(function (val) {
            return expect(val).to.equal('testvalue');
        })
    });

    it('member restarts, while map.put in progress 2', function (done) {
        this.timeout(5000);
        let member, map;
        RC.createCluster(null, null).then(function (cl) {
            cluster = cl;
            return RC.startMember(cluster.id);
        }).then(function (m) {
            member = m;
            return Client.newHazelcastClient({
                clusterName: cluster.id,
                network: {
                    connectionTimeout: 10000
                },
                properties: {
                    'hazelcast.client.heartbeat.interval': 1000,
                    'hazelcast.client.heartbeat.timeout': 3000
                }
            });
        }).then(function (cl) {
            client = cl;
            return client.getMap('test');
        }).then(function (mp) {
            map = mp;
            return RC.terminateMember(cluster.id, member.uuid);
        }).then(function () {
            map.put('testkey', 'testvalue').then(function () {
                return map.get('testkey');
            }).then(function (val) {
                try {
                    expect(val).to.equal('testvalue');
                    done();
                } catch (e) {
                    done(e);
                }
            });
        }).then(function () {
            return RC.startMember(cluster.id);
        });
    });

    it('create proxy while member is down, member comes back', function (done) {
        this.timeout(10000);
        let member, map;
        RC.createCluster(null, null).then(function (cl) {
            cluster = cl;
            return RC.startMember(cluster.id);
        }).then(function (m) {
            member = m;
            return Client.newHazelcastClient({
                clusterName: cluster.id,
                properties: {
                    'hazelcast.client.heartbeat.interval': 1000,
                    'hazelcast.client.heartbeat.timeout': 3000
                }
            });
        }).then(function (cl) {
            client = cl;
            return RC.terminateMember(cluster.id, member.uuid);
        }).then(function () {
            client.getMap('test').then(function (mp) {
                map = mp;
            }).then(function () {
                return map.put('testkey', 'testvalue');
            }).then(function () {
                return map.get('testkey');
            }).then(function (val) {
                expect(val).to.equal('testvalue');
                done();
            });
            RC.startMember(cluster.id);
        })
    });
});
