/* tslint:disable */
export class DurableExecutorMessageType {
    static DURABLEEXECUTOR_SHUTDOWN = 0x1b01;
    static DURABLEEXECUTOR_ISSHUTDOWN = 0x1b02;
    static DURABLEEXECUTOR_SUBMITTOPARTITION = 0x1b03;
    static DURABLEEXECUTOR_RETRIEVERESULT = 0x1b04;
    static DURABLEEXECUTOR_DISPOSERESULT = 0x1b05;
    static DURABLEEXECUTOR_RETRIEVEANDDISPOSERESULT = 0x1b06;
}
