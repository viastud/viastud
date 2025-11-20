output "certificate_staging" {
  value = {
    "web" : module.certificate_web_staging.validation_dns_records,
    "professor" : module.certificate_professor_staging.validation_dns_records,
    "backoffice" : module.certificate_backoffice_staging.validation_dns_records,
  }
}

output "certificate_prod" {
  value = {
    "web" : module.certificate_web_prod.validation_dns_records,
    "professor" : module.certificate_professor_prod.validation_dns_records,
    "backoffice" : module.certificate_backoffice_prod.validation_dns_records,
  }
}

output "cloudfront_ids" {
  value = {
    "web" = {
      "staging" = module.web_staging.cloudfront_distribution
      "prod" = module.web_prod.cloudfront_distribution
    }
    "backoffice" = {
      "staging" = module.backoffice_staging.cloudfront_distribution
      "prod" = module.backoffice_prod.cloudfront_distribution
    }
    "professor" = {
      "staging" = module.professor_staging.cloudfront_distribution
      "prod" = module.professor_prod.cloudfront_distribution
    }
  }
}

output "domains" {
  value = {
    "web" = {
      "staging" = module.web_staging.cloudfront_dns_name
      "prod" = module.web_prod.cloudfront_dns_name
    }
    "backoffice" = {
      "staging" = module.backoffice_staging.cloudfront_dns_name
      "prod" = module.backoffice_prod.cloudfront_dns_name
    }
    "professor" = {
      "staging" = module.professor_staging.cloudfront_dns_name
      "prod" = module.professor_prod.cloudfront_dns_name
    }
    "backend" = {
      "staging" = module.backend_staging.public_ip
      "prod" = module.backend_prod.public_ip
    }
  }
}

