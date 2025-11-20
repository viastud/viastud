resource "aws_security_group" "database_security_group" {
  count       = var.public ? 1 : 0
  description = "Security group that allow database acces from any IP."
  vpc_id      = var.vpc_id

  ingress {
    from_port   = var.db_port
    to_port     = var.db_port
    protocol    = "tcp"
    cidr_blocks = var.cidr_blocks
  }
}

resource "aws_db_instance" "database" {
  allocated_storage = var.allocated_storage
  engine            = var.db_engine
  instance_class    = var.db_instance_class
  identifier        = var.identifier

  username = var.db_username
  password = var.db_password
  db_name  = var.db_name
  port     = var.db_port

  backup_retention_period      = 14
  deletion_protection          = var.deletion_protection
  performance_insights_enabled = var.performance_insights_enabled

  publicly_accessible = var.public

  final_snapshot_identifier = "database-final-snapshot"

  storage_encrypted = true

  vpc_security_group_ids = var.public ? [aws_security_group.database_security_group[0].id] : null

  parameter_group_name = var.parameter_group_name
}
