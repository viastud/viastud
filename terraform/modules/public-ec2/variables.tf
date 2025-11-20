variable "cidr" {
  type     = list(string)
  default  = ["0.0.0.0/0"]
  nullable = false
}

variable "instance_name" {
  type = string
}

variable "ami_name" {
  type     = string
  nullable = false
}

variable "public_key_path" {
  type     = string
  nullable = false
}

variable "private_key_path" {
  type     = string
  nullable = true
  default  = null
}

variable "key_name" {
  type     = string
  nullable = false
}
variable "instance_type" {
  type     = string
  nullable = true
  default  = "t3.small"
}

variable "domain_name" {
  type     = string
  nullable = true
  default  = ""
}

variable "zone_id" {
  type     = string
  nullable = true
  default  = null
}

variable "port" {
  type     = string
  nullable = false
}

variable "policies" {
  type    = list(string)
  default = []
}
