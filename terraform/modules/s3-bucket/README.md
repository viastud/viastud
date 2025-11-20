# S3 Bucket module

This module creates a S3 bucket.

## Prerequesite

None.

## Usage

This bucket won't be public. Use pre-signed url to upload or fetch its objects.
More information [here](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_s3_request_presigner.html)

### Variables

- **bucket_name** : Bucket name

### Example

You can call this module in your `main.tf` file.

```
module "my_bucket" {
  source = "./modules/s3-bucket"

  bucket_name = "my-bucket-name"
}
```
