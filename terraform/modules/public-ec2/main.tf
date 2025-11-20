resource "aws_key_pair" "my-ssh-key" {
  key_name   = var.key_name
  public_key = file(var.public_key_path)
}

resource "aws_security_group" "ec2_security_group" {
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.cidr
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = "0"
    to_port     = "0"
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "web" {
  ami                         = var.ami_name
  instance_type               = var.instance_type
  key_name                    = aws_key_pair.my-ssh-key.key_name
  vpc_security_group_ids      = [aws_security_group.ec2_security_group.id]
  associate_public_ip_address = true

  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  tags = {
    Name = var.instance_name
  }

  user_data_base64 = base64encode("${templatefile("${path.module}/setup.sh", {
    ssh_private_key = var.private_key_path != null ? file(var.private_key_path) : "",
    domain_name     = var.domain_name
    port            = var.port
  })}")

  user_data_replace_on_change = true
}

resource "aws_eip" "eip" {
  instance = aws_instance.web.id
}

resource "aws_route53_record" "dns" {
  count   = var.domain_name != "" && var.zone_id != null ? 1 : 0
  zone_id = var.zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = "300"
  records = [aws_eip.eip.public_ip]
}


resource "aws_iam_role" "ec2_role" {
  name = format("%sInstanceRole", join("", [for word in split("-", var.instance_name) : title(word)]))

  assume_role_policy = data.aws_iam_policy_document.instance_assume_role_policy.json
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = format("%sInstanceProfile", join("", [for word in split("-", var.instance_name) : title(word)]))
  role = aws_iam_role.ec2_role.name
}

data "aws_iam_policy_document" "instance_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "ec2_policy" {
  count      = length(var.policies)
  role       = aws_iam_role.ec2_role.id
  policy_arn = var.policies[count.index]
}
