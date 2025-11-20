# Static website hosted on S3 module

This module creates a static S3 website.

## Prerequesite

If you want to enable HTTPS, you will have to setup the certificate-us module first.
Otherwise, none.

## Usage

Specify a domain name and a certificate domain if you are using a certificate validated by an external domain name.
Specify a domain name and a zone domain name if you are using a certificate validated in a route 53 zone.

### Variables

- **bucket_name** : Bucket name
- **domain_name** : Link a US-EAST-1 certificate to a domain name. Enter the domain name linked to the certificate you have issued.
- **certificate_domain** : Provide your certificate_domain here, it can be the same as domain_name, or not. (For example if your certificate domain is \*.galadrim.fr)
- **zone_domain_name(optionnal)** : If your domain name is hosted on route 53, providing the zone domain name will automatically create the record to redirect your domain name towards the cloudfront distribution. The domain name must be a subdomain of the zone domain name.
- **lambda_arn(optionnal)** : Specify the arn from the output of the lambda-basic-auth module.

### Example

You can call this module in your `main.tf` file.

```
module "my_website" {
  source = "./modules/s3-static-website"

  bucket_name = "my-website"
  domain_name = "my_subdomain.galadrim.fr"
  certificate_domain = "certificatedomain.galadrim.fr"
  zone_domain_name = "galadrim.fr"
}
```
