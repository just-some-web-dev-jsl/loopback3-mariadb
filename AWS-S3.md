# AWS-S3

## 버킷: 사용용도별

### backup

- backup.cloudwatch.umma => [AWS-CLOUDWATCH.md 파일 참조](./AWS-CLOUDWATCH.md)

### production

- production.admin.umma
- production.desktop.umma
- production.mobile.umma
- production.private-storage.umma
- production.storage.umma

### staging

- staging.admin.umma
- staging.desktop.umma
- staging.mobile.umma
- staging.private-storage.umma
- staging.storage.umma

### development

- umma
- umma\.io

## 권한: 버킷 정책

- 배포 버킷 정책
  - arn:aws:s3:::staging.admin.umma
  - arn:aws:s3:::staging.desktop.umma
  - arn:aws:s3:::staging.mobile.umma
  - arn:aws:s3:::production.admin.umma
  - arn:aws:s3:::production.desktop.umma
  - arn:aws:s3:::production.mobile.umma

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadForGetBucketObjects",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::production.admin.umma/*"
    },
    {
      "Sid": "IPDeny",
      "Effect": "Deny",
      "Principal": {
        "AWS": "*"
      },
      "Action": ["s3:PutObject", "s3:PutObjectAcl"],
      "Resource": "arn:aws:s3:::production.admin.umma/*",
      "Condition": {
        "NotIpAddress": {
          "aws:SourceIp": "1.212.71.98/32"
        }
      }
    }
  ]
}
```

- 퍼블릭 액세스 버킷 정책
  - arn:aws:s3:::umma.io
  - arn:aws:s3:::staging.storage.umma
  - arn:aws:s3:::production.storage.umma

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadForGetBucketObjects",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::production.storage.umma/*"
    }
  ]
}
```

- 프라이빗 액세스 버킷 정책
  - arn:aws:s3:::umma
  - arn:aws:s3:::staging.private-storage.umma
  - arn:aws:s3:::production.private-storage.umma

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadForGetBucketObjects",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::297982313647:user/umma"
      },
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::production.private-storage.umma/*"
    }
  ]
}
```
