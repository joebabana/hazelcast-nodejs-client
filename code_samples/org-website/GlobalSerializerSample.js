/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

var Client = require('hazelcast-client').Client;
var Config = require('hazelcast-client').Config;
var cfg = new Config.ClientConfig();

function GlobalSerializer() {
    // Constructor function
}

GlobalSerializer.prototype.getId = function () {
    return 20;
};

GlobalSerializer.prototype.read = function (input) {
    // return MyFavoriteSerializer.deserialize(input.readByteArray());
};

GlobalSerializer.prototype.write = function (output, obj) {
    // output.writeByteArray(MyFavoriteSerializer.serialize(obj))
};

cfg.serializationConfig.globalSerializer = new GlobalSerializer();
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient(cfg).then(function (hz) {
    // GlobalSerializer will serialize/deserialize all non-builtin types
    hz.shutdown();
});


