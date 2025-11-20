variable "staging_database" {
  type = object({
    username = string
    password = string
  })
}

variable "prod_database" {
  type = object({
    username = string
    password = string
  })
}

variable "domain_name" {
  type = string
}
