# AWS cost explorer module

This module creates a cost explorer alert that you can use to get the cost of your resources.

## Prerequesite

None.

## Usage

### Variables

- **cost_explorer_alert_name** : Name of the cost explorer alert.
- **budget_limit_amount** : The amount for the budget alert.
- **notification_emails** : List of emails that will receive the notification.
- **budget_limit_unit(optionnal)** : The currency used for the budget, such as USD or GB. USD by default.
- **budget_time_unit(optionnal)** : The length of time until a budget resets the actual and forecasted spend. MONTHLY by default. Valid values: MONTHLY, QUARTERLY, ANNUALLY, and DAILY.
- **notification_threshold(optionnal)** : Threshold when the notification should be sent. 100 by default.
- **notification_type(optionnal)** : What kind of budget value to notify on. PERCENTAGE by default. Valid values: PERCENTAGE, FORECASTED.

### Example

You can call this module in your `main.tf` file.

```
module "aws_cost_alert" {
  source = "./modules/aws-cost"

  cost_explorer_alert_name = "my-project-cost-alert"
  budget_limit_amount      = 100
  notification_emails      = ["contact@galadrim.fr", "moi@galadrim.fr"]
}
```
