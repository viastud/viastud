terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0.0"
    }
  }

  backend "s3" {
    bucket  = "viastud-terraform"
    key     = "terraform.tfstate"
    region  = "eu-west-3"
    profile = "viastud"
  }
}

provider "aws" {
  profile = "viastud"
  region  = "eu-west-3"
}

provider "aws" {
  alias   = "us_east_1"
  profile = "viastud"
  region  = "us-east-1"
}

resource "aws_iam_role" "ec2_role" {
  name = "ec2_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        "Effect" = "Allow",
        "Action" = [
          "sts:AssumeRole"
        ],
        "Principal" = {
          "Service" = [
            "ec2.amazonaws.com"
          ]
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "ec2_policy" {
  name = "ec2_policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:*"]
        Resource = ["*"]
      }
    ]
  })
}

module "recording_bucket" {
  source = "./modules/s3-bucket"

  bucket_name = "viastud-recordings"
}

resource "aws_iam_user" "video_sdk_user" {
  name = "video-sdk"
}

resource "aws_iam_user_policy_attachment" "recording_bucket_attach" {
  user       = aws_iam_user.video_sdk_user.name
  policy_arn = module.recording_bucket.bucket_admin_policy_arn
}

resource "aws_db_parameter_group" "default" {
  name   = "rds-pg"
  family = "postgres16"

  parameter {
    name  = "log_statement"
    value = "ddl"
  }
}


resource "aws_db_parameter_group" "posgres17" {
  name   = "rds-pg-17"
  family = "postgres17"

  parameter {
    name  = "log_statement"
    value = "ddl"
  }
}
