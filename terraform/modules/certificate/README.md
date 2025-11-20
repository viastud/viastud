# Certificate module

This module requests a certificate. If you are using Route 53 to manage your domain, it can also automatically validate it.

## Prerequesite

None.

## Usage

If you are requesting a certificate for an external domain name, make sure to create the corresponding DNS entries to validate the process, before using it in other resources.

### Variables

- **domain_name** : Domain name for which you want to create a certificate
- **zone_domain_name(optionnal)** : Zone domain name if you are using Route 53 to host your domain name. This will automatically validate the certificate you are creating. domain_name must be a subdomain of the zone domain name.
- **subject_alternative_names(optional)** : List of alternative domain names for the certificate

## Output

- **validation_dns_records** : Dns records to validate your certificate.

### Example

You can call this module in your `main.tf` file.

```
module "my_certificate" {
  source = "./modules/certificate"

  domain_name = "my_subdomain.maxlmqr.fr"
  zone_domain_name = "maxlmqr.fr"
}
```

If you want to create a certificate in the us-east zone (typically when you want to create a Cloudfront distribution and link a custom domain with HTTPS)

```
module "my_us_certificate" {
  source = "./modules/certificate"

  domain_name = "my_subdomain.maxlmqr.fr"
  zone_domain_name = "maxlmqr.fr"
  providers = {
    aws = aws.us_east_1
  }
}
```

`aws.us_east_1` refers to the provider alias declaration in your root `main.tf`
