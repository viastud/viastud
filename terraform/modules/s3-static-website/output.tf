output "cloudfront_distribution" {
  value = aws_cloudfront_distribution.bucket_cloudfront.id
}

output "cloudfront_dns_name" {
  value = aws_cloudfront_distribution.bucket_cloudfront.domain_name
}
