variable "domain_name" {
  type = string
}

variable "zone_domain_name" {
  type     = string
  default  = null
  nullable = true
}

variable "subject_alternative_names" {
  type    = list(string)
  default = []
}
