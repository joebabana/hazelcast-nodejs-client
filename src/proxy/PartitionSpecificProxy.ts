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
/** @ignore *//** */

import * as Promise from 'bluebird';
import {HazelcastClient} from '../HazelcastClient';
import {BaseProxy} from './BaseProxy';
import {ClientMessage} from '../protocol/ClientMessage';

/** @internal */
export class PartitionSpecificProxy extends BaseProxy {

    private partitionId: number;

    constructor(client: HazelcastClient, serviceName: string, name: string) {
        super(client, serviceName, name);
        this.partitionId = this.client.getPartitionService().getPartitionId(this.getPartitionKey());
    }

    protected encodeInvoke(codec: any, ...codecArguments: any[]): Promise<ClientMessage> {
        return this.encodeInvokeOnPartition(codec, this.partitionId, ...codecArguments);
    }
}
