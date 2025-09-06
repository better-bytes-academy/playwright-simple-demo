import slugify from 'slugify';
import {
    FullConfig,
    FullResult,
    Reporter,
    Suite,
    TestCase,
    TestResult,
} from "@playwright/test/reporter";
import { IncomingWebhook } from '@slack/webhook';
import { MyTestResult } from "./type";
import { sendMessage } from "./slack";
import fs from 'fs';

const url = process.env.SLACK_WEBHOOK_URL || '';
const webhook = new IncomingWebhook(url);


export default class PerifitReporter implements Reporter {
    private myResults: MyTestResult[] = [];
    suiteTitle: string;
    totalTestsRun: number;
    startTime: string;
    endTime: string;
    duration: number;
    testName = '';
    jobId = parseInt(process.env.JOB_ID || '0');
    testResultMap: Map<string, MyTestResult[]> = new Map();
    testStartTimeMap: Map<string, number> = new Map();

    onBegin(config: FullConfig, suite: Suite): void {
        this.suiteTitle = suite.title;
        this.totalTestsRun = suite.allTests().length;
        this.startTime = new Date(Date.now()).toLocaleString()

        console.log(`Start run suite: ${suite.title} (${suite.allTests().length})`);
        for (const test of suite.allTests()) {
            console.log(`- ${test.title}`);
        }
    }

    onTestBegin(test: TestCase, result: TestResult): void {
        console.log(`Test started: ${test.title} - ${test.id}`);
        this.testStartTimeMap.set(test.id, Date.now());
    }

    onTestEnd(test: TestCase, result: TestResult): void {
        console.log(`Test finished: ${test.title} - ${result.status} - ${test.location.file}`);
        // Get the tag from test.tags array (should be like '@TC001')
        const tag = test.tags.find(t => t.startsWith('@')) || 'not_defined';

        let reportPath = '';
        for (const attachment of result.attachments) {
            if (attachment.contentType === 'application/zip') {
                reportPath = attachment.path || '';
            }
        }

        this.myResults.push({
            result: result.status,
            id: tag,
            description: 'default',
            title: test.title,
            timeTaken: (Date.now() - this.testStartTimeMap.get(test.id)!) / 1000,
            reportPath: reportPath,
            reportFileName: '',
        });

        this.testName = test.title;
    }

    async onEnd(result: FullResult): Promise<void> {
        this.endTime = new Date(Date.now()).toLocaleString()
        this.duration = ((result.duration) / 1000);

        // Move all report files to the report folder
        for (const result of this.myResults) {
            const path = result.reportPath;
            // Build the file name by YYYY-MM-DD_hh-mm-ss and slugify the description
            const YMD = new Date().toISOString().split('T')[0].replace(/-/g, '-');
            const hms = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
            const filename = `${YMD}_${hms}_${slugify(result.title)}.zip`;

            if 

            console.log(path);
            console.log(filename);
            console.log(process.env.REPORT_PATH);

            fs.cpSync(path, `${process.env.REPORT_PATH || './reports'}/${filename}`);
            result.reportFileName = filename || '';
        }

        // Re-build the test result map
        this.testResultMap = new Map();
        for (const result of this.myResults) {
            if (!this.testResultMap.has(result.result)) {
                this.testResultMap.set(result.result, []);
            }
            this.testResultMap.get(result.result)?.push(result);
        }

        const resultObj = {
            testResults: this.myResults,
            jobName: process.env.JOB_NAME || this.testName,
            jobId: this.jobId,
            startTime: this.startTime,
            endTime: this.endTime,
            duration: this.duration,
            testResultMap: this.testResultMap
        }

        await sendMessage(webhook, resultObj);
    }
}
