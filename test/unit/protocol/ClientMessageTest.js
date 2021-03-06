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
const Long = require('long');

const {
    ClientMessage,
    Frame,
    BEGIN_FRAME,
    END_FRAME
} = require('../../../lib/protocol/ClientMessage');
const { CodecUtil } = require('../../../lib/codec/builtin/CodecUtil');

describe('ClientMessageTest', function () {
    it('should be encoded and decoded', function () {
        const cmEncode = ClientMessage.createForEncode();

        cmEncode.addFrame(Frame.createInitialFrame(50));
        cmEncode.setMessageType(1);
        cmEncode.setCorrelationId(Long.fromString('1234567812345678'));
        cmEncode.setPartitionId(11223344);

        const cmDecode = ClientMessage.createForDecode(cmEncode.startFrame);

        expect(cmEncode.getMessageType()).to.equal(cmDecode.getMessageType());
        expect(cmEncode.getStartFrame().flags).to.equal(cmDecode.getStartFrame().flags);
        expect(cmEncode.getCorrelationId()).to.equal(cmDecode.getCorrelationId());
        expect(cmEncode.getPartitionId()).to.equal(cmDecode.getPartitionId());
        expect(cmEncode.getTotalFrameLength()).to.equal(cmDecode.getTotalFrameLength());
    });

    it('should be copied with new correlation id and share the non-header frames', function () {
        const originalMessage = ClientMessage.createForEncode();

        originalMessage.addFrame(Frame.createInitialFrame(50));
        originalMessage.setMessageType(1);
        originalMessage.setCorrelationId(Long.fromString('1234567812345678'));
        originalMessage.setPartitionId(11223344);
        originalMessage.setRetryable(true);
        originalMessage.addFrame(Frame.createInitialFrame(20));

        const copyMessage = originalMessage.copyWithNewCorrelationId();

        // get the frame after the start frame for comparison
        originalMessage.nextFrame();
        copyMessage.nextFrame();

        const originalFrame = originalMessage.nextFrame();
        const copyFrame = copyMessage.nextFrame();

        expect(originalFrame.content).to.equal(copyFrame.content);
        expect(originalFrame.flags).to.equal(copyFrame.flags);

        expect(originalMessage.getMessageType()).to.equal(copyMessage.getMessageType());
        expect(originalMessage.getStartFrame().flags).to.equal(copyMessage.getStartFrame().flags);
        expect(originalMessage.getPartitionId()).to.equal(copyMessage.getPartitionId());
        expect(originalMessage.getTotalFrameLength()).to.equal(copyMessage.getTotalFrameLength());
        expect(copyMessage.getCorrelationId()).to.equal(-1);
    });

    it('should be fast forwardable when extended', function () {
        const clientMessage = ClientMessage.createForEncode();

        clientMessage.addFrame(BEGIN_FRAME.copy());

        // New custom-typed parameter with its own begin and end frames
        clientMessage.addFrame(BEGIN_FRAME.copy());
        clientMessage.addFrame(new Frame(Buffer.allocUnsafe(0)));
        clientMessage.addFrame(END_FRAME.copy());

        clientMessage.addFrame(END_FRAME.copy());

        // begin frame
        clientMessage.nextFrame();
        CodecUtil.fastForwardToEndFrame(clientMessage);

        expect(clientMessage.hasNextFrame()).to.be.false;
    });
});
