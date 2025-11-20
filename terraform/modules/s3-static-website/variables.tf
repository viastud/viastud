variable "bucket_name" {
  description = "Name of the s3 bucket. Must be unique."
  type        = string
}

variable "domain_name" {
  type    = string
  default = null
}

variable "certificate_arn" {
  type    = string
  default = null
}

variable "zone_domain_name" {
  type     = string
  default  = null
  nullable = true
}

variable "lambda_arn" {
  type     = string
  default  = null
  nullable = true
}
