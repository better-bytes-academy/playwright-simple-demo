import { IncomingWebhook } from '@slack/webhook';
import { JobInfo, MyTestResult } from './type';
import {  RichTextBlockElement } from '@slack/web-api';

export const sendMessage = async (webhook: IncomingWebhook, jobInfo: JobInfo) => {
    const { testResults, jobName, startTime, endTime, duration } = jobInfo;
    console.log('Run here: ', jobName);
    let passed = 0, failed = 0, timeout = 0, total = testResults.length;
    let passedCases: MyTestResult[] = [], failedCases: MyTestResult[] = [], timeoutCases: MyTestResult[] = [];

    testResults.forEach(element => {
        switch (element.result) {
            case 'passed':
                passed++;
                passedCases.push(element);
                break;
            case 'failed':
                failedCases.push(element);
                failed++;
                break;
            case 'timedOut':
                timeoutCases.push(element);
                timeout++;
                break;
        }
    });

    // Build result block
    const slackResultBlock: any[] = [];
    for (const [key, value] of jobInfo.testResultMap.entries()) {
        slackResultBlock.push(...buildRichTextBlock(key, value, total));
    }

    try {
        const testSuiteReportUrl = "link";
        let icon = '';
        const percentTestPass = ((passed / total) * 100).toFixed(2);
        if (passed > 0) {
            icon = ':white_check_mark:';
        }
        const percentTestFail = ((failed / total) * 100).toFixed(2);
        if (failed > 0) {
            icon = ':sos:';
        }
        const percentTestTimeout = ((timeout / total) * 100).toFixed(2);
        if (timeout > 0) {
            icon = ':alarm_clock:';
        }
        const fileName = process.env.FILENAME;

        await webhook.send({
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `${icon} *Job name*: ${jobName}`
                    }
                },
                ...slackResultBlock,
                {
                    "type": "divider"
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `*Start time*: ${startTime}, \n*End time*: ${endTime}`
                    },
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `*Total time run*: ${duration.toFixed(0)} s`
                    },
                }
            ]
        }
        );
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

const buildTestList = (tests: MyTestResult[]): RichTextBlockElement => {
    const items: any[] = [];
    const reportTraceURL = process.env.REPORT_TRACE_URL
    tests.forEach(item => items.push({
        "type": "rich_text_section",
        "elements": [
            {
                "type": "text",
                "text": `${item.title} (${item?.timeTaken?.toFixed(2)}s)`
            },
            {
                "type": "link",
                "text": " [View report]",
                "url": `https://trace.playwright.dev/?trace=${reportTraceURL}/reports/${item.reportFileName}`      
            },
            {
                "type": "link",
                "text": " [Re-run test]",
                "url": `${reportTraceURL}/run.html?testName=${item.id}`      
            }
        ]
    }));

    return {
        "type": "rich_text_list",
        "style": "bullet",
        "indent": 0,
        "border": 0,
        "elements": items
    };
}
const buildRichTextBlock = (blockTitle: string, tests: MyTestResult[], total: number) => {
    const capitalizeTitle = blockTitle[0].toUpperCase() + blockTitle.substring(1);
    const percent = ((tests.length / total) * 100).toFixed(2);
    return [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `${capitalizeTitle}: ${tests.length}/${total} (${percent}%)`
            },
        },
        {
            "type": "rich_text",
            "elements": [
                buildTestList(tests),
            ]
        }
    ];
}