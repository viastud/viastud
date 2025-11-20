
module "database_staging" {
  source      = "./modules/rds-database"
  db_name     = "viastud_staging"
  db_username = var.staging_database.username
  db_password = var.staging_database.password

  identifier = "via-stud-staging"

  parameter_group_name = aws_db_parameter_group.default.name
}

module "certificate_web_staging" {
  source      = "./modules/certificate"
  domain_name = "staging.app.${var.domain_name}"

  providers = {
    aws = aws.us_east_1
  }
}

module "certificate_backoffice_staging" {
  source      = "./modules/certificate"
  domain_name = "staging.backoffice.${var.domain_name}"

  providers = {
    aws = aws.us_east_1
  }
}

module "certificate_professor_staging" {
  source      = "./modules/certificate"
  domain_name = "staging.professeur.${var.domain_name}"

  providers = {
    aws = aws.us_east_1
  }
}

module "backend_staging" {
  source          = "./modules/public-ec2"
  ami_name        = "ami-0cb0b94275d5b4aec"
  key_name        = "staging"
  public_key_path = "./keys/staging.pub"
  port            = 3333
  domain_name     = "staging.api.${var.domain_name}"
  instance_name   = "via-stud-backend-staging"

  policies = [
    module.recording_bucket.bucket_admin_policy_arn,
    module.staging_bucket.bucket_admin_policy_arn
  ]
}

module "backoffice_staging" {
  source = "./modules/s3-static-website"

  bucket_name = "via-stud-backoffice-staging"

  certificate_arn = module.certificate_backoffice_staging.certificate_arn

  domain_name = "staging.backoffice.${var.domain_name}"
}

module "web_staging" {
  source = "./modules/s3-static-website"

  bucket_name = "via-stud-web-staging"

  certificate_arn = module.certificate_web_staging.certificate_arn

  domain_name = "staging.app.${var.domain_name}"
}

module "professor_staging" {
  source = "./modules/s3-static-website"

  bucket_name = "via-stud-professor-staging"

  certificate_arn = module.certificate_professor_staging.certificate_arn

  domain_name = "staging.professeur.${var.domain_name}"
}

module "staging_bucket" {
  source = "./modules/s3-bucket"

  bucket_name = "viastud-staging"
}

resource "aws_iam_user" "staging_user" {
  name = "app-staging"
}
