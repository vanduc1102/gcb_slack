# gcb_slack
Elegant notifications from Google Cloud Container Builder -> Slack.

Built on the [tutorial from Google](https://cloud.google.com/container-builder/docs/tutorials/configuring-third-party-notifications), this variant of the supplied `index.js`:
1. works
2. has colors
3. is pretty minimalistic.


# Deployment

## Create Bucket

```
gsutil mb gs://[STAGING_BUCKET_NAME]
```

## Correct Slack WebHook

```
cp .env.yaml.sample .env.yaml
```

## Deploy command

```
gcloud functions deploy subscribe --stage-bucket [STAGING_BUCKET_NAME] --trigger-topic cloud-builds --runtime nodejs10 --env-vars-file .env.yaml
```
