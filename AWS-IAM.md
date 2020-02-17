# AWS-IAM

- AWS IAM 로그인 주소
  - https://b2link.signin.aws.amazon.com/console
  - https://297982313647.signin.aws.amazon.com/console

## 그룹

- team-admin
- team-umma

## 사용자

- ses-smtp-user.20180915-121120
- ssm-parameter-user.umma
- umma

## 역할

- lambda_role
- StepFunctionExcutionRoleForMyStateMachine
- AWS_Events_Invoke_Step_Functions_963672594

## 정책

### s3-access-umma

<!-- prettier-ignore -->
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor0",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:DeleteObject",
        "s3:DeleteObjectVersion"
      ],
      "Resource": [
        "arn:aws:s3:::umma/*",
        "arn:aws:s3:::umma.io/*",
        "arn:aws:s3:::staging.storage.umma/*",
        "arn:aws:s3:::staging.private-storage.umma/*",
        "arn:aws:s3:::production.storage.umma/*",
        "arn:aws:s3:::production.private-storage.umma/*"
      ]
    }
  ]
}
```

### cloudwatch-logs-umma

<!-- prettier-ignore -->
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ],
      "Resource": ["arn:aws:logs:*:*:*"]
    }
  ]
}
```
