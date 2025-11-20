terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

resource "aws_acm_certificate" "cert" {
  domain_name               = var.domain_name
  validation_method         = "DNS"
  subject_alternative_names = var.subject_alternative_names

  lifecycle {
    create_before_destroy = true
  }
}

data "aws_route53_zone" "zone" {
  count        = var.zone_domain_name != null ? 1 : 0
  name         = var.zone_domain_name
  private_zone = false
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name    = dvo.resource_record_name
      record  = dvo.resource_record_value
      type    = dvo.resource_record_type
      zone_id = data.aws_route53_zone.zone[0].zone_id
    } if var.zone_domain_name != null
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = each.value.zone_id
}

resource "aws_acm_certificate_validation" "cert_validated" {
  count                   = var.zone_domain_name != null ? 1 : 0
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}
