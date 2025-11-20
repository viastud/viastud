
module "database_prod" {
  source      = "./modules/rds-database"
  db_name     = "viastud_prod"
  db_username = var.prod_database.username
  db_password = var.prod_database.password

  identifier = "via-stud-prod"

  parameter_group_name = aws_db_parameter_group.posgres17.name
}

module "certificate_web_prod" {
  source      = "./modules/certificate"
  domain_name = "app.${var.domain_name}"

  providers = {
    aws = aws.us_east_1
  }
}

module "certificate_backoffice_prod" {
  source      = "./modules/certificate"
  domain_name = "backoffice.${var.domain_name}"

  providers = {
    aws = aws.us_east_1
  }
}

module "certificate_professor_prod" {
  source      = "./modules/certificate"
  domain_name = "professeur.${var.domain_name}"

  providers = {
    aws = aws.us_east_1
  }
}

module "backend_prod" {
  source          = "./modules/public-ec2"
  ami_name        = "ami-0cb0b94275d5b4aec"
  key_name        = "prod"
  public_key_path = "./keys/prod.pub"
  port            = 3333
  domain_name     = "api.${var.domain_name}"
  instance_name   = "via-stud-backend-prod"

  policies = [
    module.recording_bucket.bucket_admin_policy_arn,
    module.prod_bucket.bucket_admin_policy_arn
  ]
}

module "backoffice_prod" {
  source = "./modules/s3-static-website"

  bucket_name = "via-stud-backoffice-prod"

  certificate_arn = module.certificate_backoffice_prod.certificate_arn

  domain_name = "backoffice.${var.domain_name}"
}

module "web_prod" {
  source = "./modules/s3-static-website"

  bucket_name = "via-stud-web-prod"

  certificate_arn = module.certificate_web_prod.certificate_arn

  domain_name = "app.${var.domain_name}"
}

module "professor_prod" {
  source = "./modules/s3-static-website"

  bucket_name = "via-stud-professor-prod"

  certificate_arn = module.certificate_professor_prod.certificate_arn

  domain_name = "professeur.${var.domain_name}"
}

module "prod_bucket" {
  source = "./modules/s3-bucket"

  bucket_name = "viastud-prod"
}

resource "aws_iam_user" "prod_user" {
  name = "app-prod"
}

resource "aws_iam_user_policy_attachment" "prod_bucket_attach" {
  user       = aws_iam_user.prod_user.name
  policy_arn = module.prod_bucket.bucket_admin_policy_arn
}


resource "aws_iam_user_policy_attachment" "prod_recording_bucket_attach" {
  user       = aws_iam_user.prod_user.name
  policy_arn = module.recording_bucket.bucket_admin_policy_arn
}
