# RDS Mysql module

This module creates a RDS database using mysql engine.

## Prerequesite

If you want to make your database public, you will need to get your default VPC. Check the root README.md for more details.
Otherwise, there are no prerequesite. By default, this module set your database public.

## Usage

### Variables

- **db_username** : Username for your database access.
- **db_password** : Password for your database access.
- **vpc_id** : VPC Id used for security group. Not required if you set public to false.
- **db_instance_class (optional)** : Instance class of the RDS instance, if you need ssomething powerful. Default to db.t4g.micro. Some classes may not be compatible with Performance Insight.
- **identifier(optional)** : The name of the RDS instance, if omitted, Terraform will assign a random, unique identifier
- **public (optional)** : Determine wether the database should be accessible from any IP. Default is set to true.
- **cidr_blocks(optional)** : List of IPs to whitelist to access database. Default to 0.0.0.0/0
- **db_name (optional)** : Specify a name to create a first database when creating the instance.
- **db_port (optional)** : Specify a port for the database.
- **allocated_storage (optional)** : Storage allocated in GB, default is set to 10.
- **db_engine(optional)** : Engine of the database. Postgres by default
- **deletion_protection(optional)** : Boolean to determine if database should be protected from accidental deletion. Default to true.
- **performance_insight_enabled(optional)** : Boolean to enable performance insight (note, require some specific instance class : [here](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PerfInsights.Overview.Engines.html)).

### Example

You can call this module in your `main.tf` file. Your username and password would probably come from `.tfvars` files.

```
module "my_database" {
  source = "./modules/rds-database"

  db_username = var.db_username
  db_password = var.db_password
  vpc_id      = aws_default_vpc.main.id
  cidr_blocks = ["84.98.200.60/32"]
}
```

## Output

- **endpoint** : Endpoint of the RDS instance created.
