# Route 53 hosted zone module

This module creates a hosted zone. This allow you to manage your routes from Route 53 instead of your external provider.
If you buy your domain name on AWS, you will already have your hosted zone created. You can use its zone domain name in the module when asked.

## Prerequesite

None.

## Usage

You will need to validate the hosting of the zone by updating your external domain provider (such as OVH, Ionos, ...).

### Variables

- **domain_name** : Your domain name for which you want to create a hosted zone.

### Example

You can call this module in your `main.tf` file.

```
module "my_hosted_zone" {
  source = "./modules/route-53-zone"

  domain_name = "maxlmqr.fr"
}
```

### Output

You can then use this module into other modules, such as static website creation to provide the zone domain name.
