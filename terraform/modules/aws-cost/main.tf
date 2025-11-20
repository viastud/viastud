resource "aws_budgets_budget" "overall_budget_cost_email_notification" {
  name         = var.cost_explorer_alert_name
  budget_type  = "COST"
  limit_amount = var.budget_limit_amount
  limit_unit   = var.budget_limit_unit
  time_unit    = var.budget_time_unit

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = var.notification_threshold
    threshold_type             = "PERCENTAGE"
    notification_type          = var.notification_type
    subscriber_email_addresses = var.notification_emails
  }
}
