# Output variable definitions

output "endpoint" {
  description = "Database endpoint"
  value       = aws_db_instance.database.endpoint
}
