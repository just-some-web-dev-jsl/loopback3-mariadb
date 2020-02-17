# AWS-CLOUDWATCH

## 로그 그룹 설정

| 로그 그룹                                  | 인사이트 | 이벤트 만료 시점 | 지표 필터 | 구독 |
| ------------------------------------------ | -------- | ---------------- | --------- | ---- |
| /aws/lambda/export-cloudwatch-logs-to-s3   | 둘러보기 | 1개월(30일)      | 0 필터    | 없음 |
| /aws/rds/instance/umma-db-production/error | 둘러보기 | 3개월(90일)      | 0 필터    | 없음 |
| /aws/rds/instance/umma-db-staging2/error   | 둘러보기 | 3개월(90일)      | 0 필터    | 없음 |
| RDSOSMetrics                               | 둘러보기 | 3개월(90일)      | 0 필터    | 없음 |
| umma-development                           | 둘러보기 | 1주(7일)         | 0 필터    | 없음 |
| umma-production                            | 둘러보기 | 3개월(90일)      | 0 필터    | 없음 |
| umma-staging                               | 둘러보기 | 1개월(30일)      | 0 필터    | 없음 |

## 로그 수집

- https://ap-northeast-2.console.aws.amazon.com/cloudwatch/home?region=ap-northeast-2#logs:
- 백엔드 서비스 로그는 모두 AWS CloudWatch 를 사용하고 있다.
- pm2 를 이용한 클러스터 모드로 운영중이므로 동일한 로그 스트림명을 사용할 경우 충돌이 발생한다.
  따라서 로그 그룹내의 로그 스트림명을 각각의 프로세스 단위로 전송 및 수집을 하고 있다.
  단, 배치 서비스는 포크 모드로 운영중이므로 단일 스트림명으로 전송하고 있다.
  - ex) server_info_ip-172-31-26-196_25
  - ex) batch

## 수동 로그 백업

- CloudWatch 로그 그룹별로 최근 30일간의 로그를 보관하도록 설정한다. (비용 절감을 위해 단기간으로 설정)
- S3 버킷으로 로그를 백업한다. (일 단위)
  - S3 버킷 이름: backup.cloudwatch.umma
  - S3 버킷 접두사: backup/umma-production/2019/6/1
  - 참조: https://docs.aws.amazon.com/ko_kr/AmazonCloudWatch/latest/logs/S3ExportTasksConsole.html

## 자동 로그 백업

- IAM 정책 및 역할 추가
  - lambda_role 역할에 하단의 lambda-cloudwatch-s3 정책을 추가한다.
- Lambda 함수 생성
  - 이름: export-cloudwatch-logs-to-s3
  - lambda_role 적용
- Step Functions 상태 머신 생성
  - 이름: export-cloudwatch-logs-to-s3
  - 코드 조각 생성 선택 > 하단 Amazon States 언어 코드 붙여넣기
  - 실행에 대한 IAM 역할 > 나를 위한 IAM 역할 생성 > 이름: StepFunctionExcutionRoleForMyStateMachine
- CloudWatch 이벤트에 규칙 생성
  - 이름: export-to-s3-umma
  - 이벤트 소스 > Cront 식: 0 0 \* \* ? \*
  - 대상 > Step Functions 상태 시스템 > export-cloudwatch-logs-to-s3 선택 > 상수(JSON 텍스트): 하단 상수값 붙여넣기

### IAM 정책 생성: lambda-cloudwatch-s3

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor0",
      "Effect": "Allow",
      "Action": [
        "logs:CreateExportTask",
        "logs:DescribeExportTasks",
        "logs:CreateLogStream",
        "logs:CreateLogGroup",
        "logs:DescribeLogGroups",
        "logs:PutLogEvents",
        "s3:PutBucketPolicy",
        "s3:CreateBucket",
        "s3:ListBucket",
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation"
      ],
      "Resource": "*"
    }
  ]
}
```

### IAM 역할: lambda_role 신뢰 관계 정책

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### Lambda 함수 생성

- export-cloudwatch-logs-to-s3

```javascript
const AWS = require('aws-sdk');
let cloudwatchLogsInstance = {};
let s3Instance = {};
let __region = '';

function setRegion(_region) {
  __region = _region;
}

function setInstance(_region) {
  cloudwatchLogsInstance = new AWS.CloudWatchLogs({ region: __region });
  s3Instance = new AWS.S3({ region: __region });
}

function getS3Buckets() {
  return s3Instance.listBuckets({}).promise();
}

async function isS3BucketExists(bucketName) {
  try {
    const bucketsObject = await getS3Buckets();
    const isBucketExists = bucketsObject.Buckets.find(bucket => {
      return bucket.Name === bucketName;
    });
    if (isBucketExists) return true;
    else return false;
  } catch (err) {
    console.error(err);
  }
}

async function createS3BucketAndPutPolicy(bucketName) {
  try {
    const _isS3BucketExist = await isS3BucketExists(bucketName);
    if (_isS3BucketExist) {
      console.log('s3 bucket exists');
    } else {
      await s3Instance
        .createBucket({
          Bucket: bucketName,
        })
        .promise();
      console.log('s3 bucket is created ', bucketName);
      await s3Instance
        .putBucketPolicy({
          Bucket: bucketName,
          Policy: '{"Version": "2012-10-17",\
                    "Statement": [{"Effect": "Allow",\
                            "Principal": {\
                                "Service": "logs.' + __region + '.amazonaws.com"\
                            },\
                            "Action": "s3:GetBucketAcl",\
                            "Resource": "arn:aws:s3:::' + bucketName + '"\
                        },\
                        {\
                            "Effect": "Allow",\
                            "Principal": {\
                                "Service": "logs.' + __region + '.amazonaws.com"\
                            },\
                            "Action": "s3:PutObject",\
                            "Resource": "arn:aws:s3:::' + bucketName + '/*",\
                            "Condition": {\
                                "StringEquals": {\
                                    "s3:x-amz-acl": "bucket-owner-full-control"\
                                }\
                            }\
                        }\
                    ]\
                }',
        })
        .promise();
      console.log('s3 bucket policy is added');
    }
  } catch (err) {
    console.error(err);
  }
}

function getDatePath(dateObj) {
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const date = dateObj.getDate();
  return `${year}/${month}/${date}`;
}

function getLogPathForS3(logGroupName) {
  if (logGroupName.startsWith('/')) {
    logGroupName = logGroupName.slice(1);
  }
  return logGroupName.replace(/\//g, '-');
}

function wait(timeout) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
}

function describeExportTask(taskId) {
  let params = {
    taskId: taskId,
  };
  return cloudwatchLogsInstance.describeExportTasks(params).promise();
}

let waitErrorCount = 0;
async function waitForExportTaskToComplete(taskId) {
  try {
    const taskDetails = await describeExportTask(taskId);
    const task = taskDetails.exportTasks[0];
    const taskStatus = task.status.code;
    if (taskStatus === 'RUNNING' || taskStatus.indexOf('PENDING') !== -1) {
      console.log('Task is running for ', task.logGroupName, 'with stats', task.status);
      await wait(1000);
      return await waitForExportTaskToComplete(taskId);
    }
    return true;
  } catch (error) {
    waitErrorCount++;
    if (waitErrorCount < 3) {
      return await waitForExportTaskToComplete(taskId);
    }
    throw error;
  }
}

async function exportToS3Task(s3BucketName, logGroupName, logFolderName) {
  try {
    const logPathForS3 = getLogPathForS3(logGroupName);
    const today = new Date();
    const fromDate = new Date();
    fromDate.setDate(today.getDate() - 1); // 1일전 로그 백업
    const params = {
      destination: s3BucketName,
      destinationPrefix: `${logFolderName}/${logPathForS3}/${getDatePath(fromDate)}`,
      from: fromDate.getTime(),
      logGroupName: logGroupName,
      to: today.getTime(),
    };
    const response = await cloudwatchLogsInstance.createExportTask(params).promise();
    await waitForExportTaskToComplete(response.taskId);
  } catch (error) {
    throw error;
  }
}

function getCloudWatchLogGroups(nextToken, limit) {
  const params = {
    nextToken: nextToken,
    limit: limit,
  };
  return cloudwatchLogsInstance.describeLogGroups(params).promise();
}

exports.handler = async event => {
  const region = event.region;
  const s3BucketName = event.s3BucketName;
  const logFolderName = event.logFolderName;
  const nextToken = event.nextToken;
  const logGroupFilter = event.logGroupFilter;
  try {
    setRegion(region);
    setInstance();
    await createS3BucketAndPutPolicy(s3BucketName);
    let cloudWatchLogGroups = await getCloudWatchLogGroups(nextToken, 1);
    event.nextToken = cloudWatchLogGroups.nextToken;
    event.continue = cloudWatchLogGroups.nextToken !== undefined;
    if (cloudWatchLogGroups.logGroups.length < 1) {
      return event;
    }
    const logGroupName = cloudWatchLogGroups.logGroups[0].logGroupName;
    if (logGroupFilter && logGroupName.toLowerCase().indexOf(logGroupFilter) < 0) {
      // Ignore log group
      return event;
    }
    await exportToS3Task(s3BucketName, logGroupName, logFolderName);
    console.log('Successfully created export task for ', logGroupName);
    return event;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
```

### Step Functions 상태 머신 생성

- 위에서 생성한 Lambda 함수 ARN 을 아래 코드 LAMBDA_FUNCTION_ARN 에 적용하고 상태 머신을 정의한다.
  - export-cloudwatch-logs-to-s3
  - 현재 사용중인 Lambda 함수 ARN
    > arn:aws:lambda:ap-northeast-2:297982313647:function:export-cloudwatch-logs-to-s3

### Step Functions 상태 머신 생성 Amazon States 언어 코드

```json
{
  "StartAt": "CreateExportTask",
  "States": {
    "CreateExportTask": {
      "Type": "Task",
      "Resource": "LAMBDA_FUNCTION_ARN",
      "Next": "IsAllLogsExported"
    },
    "IsAllLogsExported": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.continue",
          "BooleanEquals": true,
          "Next": "CreateExportTask"
        }
      ],
      "Default": "SuccessState"
    },
    "SuccessState": {
      "Type": "Succeed"
    }
  }
}
```

### CloudWatch 이벤트 생성 JSON 상수값

```json
{
  "region": "ap-northeast-2",
  "logGroupFilter": "umma-production",
  "s3BucketName": "backup.cloudwatch.umma",
  "logFolderName": "backup"
}
```

- 참고 이미지
  ![How this automation works](https://cdn-images-1.medium.com/max/800/1*EY0-gvhgZC7L5SMeTQ0gww.jpeg)

- Lambda 함수 생성: [콘솔로 Lambda 함수 만들기](https://docs.aws.amazon.com/ko_kr/lambda/latest/dg/getting-started-create-function.html)
- Lambda 상태 시스템 생성: [AWS Step Functions](https://docs.aws.amazon.com/ko_kr/step-functions/latest/dg/tutorial-creating-lambda-state-machine.html)

- 참고문서
  - [Exporting of AWS CloudWatch logs to S3 using Automation](https://medium.com/tensult/exporting-of-aws-cloudwatch-logs-to-s3-using-automation-2627b1d2ee37)
  - [CLOUDWATCH & LOGS WITH LAMBDA FUNCTION / S3](https://www.bogotobogo.com/DevOps/AWS/aws-CloudWatch-logs-Lambda-S3.php)

## 로그 백업용 S3 버킷 정책

- backup.cloudwatch.umma 버킷 정책 설정

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "logs.ap-northeast-2.amazonaws.com"
      },
      "Action": "s3:GetBucketAcl",
      "Resource": "arn:aws:s3:::backup.cloudwatch.umma"
    },
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "logs.ap-northeast-2.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::backup.cloudwatch.umma/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-acl": "bucket-owner-full-control"
        }
      }
    }
  ]
}
```

## 경보

- 지표 필터에 추가된 특수한 에러에 대해 경보를 생성해서 이메일 알림을 받는다.

  - Amazon Simple Notification Service(SNS) 서비스에 등록된 이메일 그룹과 연동된다.
  - 경보: umma-production-error-special
    - 로그 그룹: umma-production
      - 필터 이름: level-error-special
      - 필터 패턴: { $.level = "error" && $.statusCode != 400 && $.statusCode != 401 && $.statusCode != 403 && \$.statusCode != 404 }
      - 지표: LogMetrics/umma-production-error-special
  - 경보: umma-staging-error-special
    - 로그 그룹: umma-staging
      - 필터 이름: level-error-special
      - 필터 패턴: { $.level = "error" && $.statusCode != 400 && $.statusCode != 401 && $.statusCode != 403 && \$.statusCode != 404 }
      - 지표: LogMetrics/umma-staging-error-special

- 참고 이미지
  ![How Amazon CloudWatch Works](https://www.bogotobogo.com/DevOps/AWS/images/AWS-CloudWatch-Logs/HowCloudWatchWorks.png)

## 로그 - 인사이트

- 로그 그룹: umma-production 또는 umma-staging

### 쿼리

```typescript
fields @timestamp, @message
| filter level = "error"
| filter statusCode != 400 | filter statusCode != 401 | filter statusCode != 403 | filter statusCode != 404
| sort @timestamp desc
| limit 100
```
