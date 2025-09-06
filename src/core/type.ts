export type MyTestResult = {
    result: "passed"|"failed"|"timedOut"|"skipped"|"interrupted",
    id: string;
    tag?: string;
    description: string;
    timeTaken?: number;
    title: string;
    reportPath: string;
    reportFileName: string;
}

export type JobInfo = {
    testResults: MyTestResult[],
    testResultMap: Map<string, MyTestResult[]>,
    jobName: string;
    jobId: number;
    startTime: string;
    endTime: string;
    duration: number;
}