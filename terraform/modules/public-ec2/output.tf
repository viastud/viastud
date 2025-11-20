output "vpc_security_group_id" {
  value = aws_security_group.ec2_security_group.id
}

output "public_ip" {
  value = aws_eip.eip.public_ip
}
