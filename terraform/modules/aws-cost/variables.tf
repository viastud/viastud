variable "cost_explorer_alert_name" {
  type = string
}

variable "budget_limit_amount" {
  type = number
}

variable "notification_emails" {
  type = list(string)
}

variable "budget_limit_unit" {
  type     = string
  default  = "USD"
  nullable = true
}

variable "budget_time_unit" {
  type     = string
  default  = "MONTHLY"
  nullable = true
}

variable "notification_threshold" {
  type     = number
  default  = 100
  nullable = true
}

variable "notification_type" {
  type     = string
  default  = "ACTUAL"
  nullable = true
}
