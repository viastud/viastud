variable "vpc_id" {
  type     = string
  default  = null
  nullable = true
}

variable "db_instance_class" {
  description = "Instance class of the RDS instance."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_password" {
  description = "Database password."
  type        = string
}

variable "db_username" {
  description = "Database username."
  type        = string
}

variable "db_port" {
  description = "Database port."
  type        = number
  default     = 5432
}

variable "db_name" {
  description = "Database name."
  type        = string
  default     = null
  nullable    = true
}

variable "db_engine" {
  type    = string
  default = "postgres"
}

variable "allocated_storage" {
  description = "Storage allocated in GB."
  type        = number
  default     = 20
}

variable "public" {
  description = "Determine wether the database should be accessible from any IP"
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "True if you want to prevent instance from being accidentally deleted"
  type        = bool
  default     = true
}

variable "performance_insights_enabled" {
  description = "True if you want to enable performance insight"
  type        = bool
  default     = false
}

variable "identifier" {
  description = "The name of the RDS instance, if omitted, Terraform will assign a random, unique identifier."
  type        = string
  default     = null
  nullable    = true
}

variable "cidr_blocks" {
  description = "A list of CIDRS to allow access to."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "parameter_group_name" {
  description = "The name of the parameter group to associate with the DB instance."
  type        = string
  default     = null
}
