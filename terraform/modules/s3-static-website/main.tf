terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

resource "aws_s3_bucket" "b" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_public_access_block" "public_access_block" {
  bucket = aws_s3_bucket.b.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}


resource "aws_s3_bucket_ownership_controls" "my_bucket_ownership" {
  depends_on = [aws_s3_bucket_public_access_block.public_access_block]
  bucket     = aws_s3_bucket.b.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_policy" "public_access_policy" {
  bucket     = aws_s3_bucket.b.id
  depends_on = [aws_s3_bucket_public_access_block.public_access_block]
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = ["s3:GetObject"],
        Effect    = "Allow"
        Sid       = "PublicReadGetObject"
        Principal = "*"
        Resource  = ["arn:aws:s3:::${var.bucket_name}/*"]
      },
    ]
  })
}

resource "aws_s3_bucket_website_configuration" "s3_bucket" {
  bucket = aws_s3_bucket.b.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

locals {
  s3_origin_id = "myS3Origin"
}
resource "aws_cloudfront_distribution" "bucket_cloudfront" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = var.domain_name != null ? [var.domain_name] : []

  origin {
    domain_name = aws_s3_bucket_website_configuration.s3_bucket.website_endpoint
    origin_id   = local.s3_origin_id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  custom_error_response {
    error_caching_min_ttl = 10
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 10
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }

  viewer_certificate {
    acm_certificate_arn            = var.certificate_arn
    ssl_support_method             = var.certificate_arn == null ? null : "sni-only"
    cloudfront_default_certificate = var.certificate_arn == null ? true : null
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    dynamic "lambda_function_association" {
      for_each = var.lambda_arn != null ? [1] : []
      content {
        event_type   = "viewer-request"
        lambda_arn   = var.lambda_arn
        include_body = false
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # Cache behavior with precedence 0
  ordered_cache_behavior {
    path_pattern     = "/content/immutable/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false
      headers      = ["Origin"]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  # Cache behavior with precedence 1
  ordered_cache_behavior {
    path_pattern     = "/content/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }
}

data "aws_route53_zone" "zone" {
  count = var.zone_domain_name != null ? 1 : 0
  name  = var.zone_domain_name
}

resource "aws_route53_record" "redirection" {
  count   = var.zone_domain_name != null ? 1 : 0
  zone_id = data.aws_route53_zone.zone[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.bucket_cloudfront.domain_name
    zone_id                = aws_cloudfront_distribution.bucket_cloudfront.hosted_zone_id
    evaluate_target_health = false
  }
}
