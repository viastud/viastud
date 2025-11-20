# EC2 public instance module

This module creates an ec2 accessible via ssh. Which can be used to run a server.

## Prerequesite

None.

## Usage

### Variables

- **instance_name** : The name of the ec2 instance.
- **ami_name** : The name of the ami to use for the ec2 instance. (See [AWS doc on how to find an AMI](https://docs.aws.amazon.com/linux/al2023/ug/ec2.html))
- **cidr (optional)** : Network cidr to allow access to the ec2 instance. Recommended to restrict access only to Galadrim IP in production.
- **public_key_path** : The path to the public key to allow ssh access to the ec2 instance.
- **private_key_path (optional)** : The path to the private key to allow the instance to clone the project.
- **key_name** : The name of the key to allow ssh access to the ec2 instance.
- **instance_type (optonnal)** : The instance type to use for the ec2 instance. default to t3.small
- **domain_name (optional)** : The domain name to use for the ec2 instance.
- **zone_id (optional)** : Zone Id to use to create a record for the domain_name.
- **port** : The port on which the server is running.

### Create resource

You can call this module in your `main.tf` file.

```terraform
module "ec2_instance" {
  source = "./modules/ec2-instance"

  instance_name    = "my-ec2-instance"
  ami_name         = "my-ami-name"
  public_key_path  = var.public_key_path_for_ec2
  private_key_path = var.private_key_path_for_ec2
  key_name         = "my-key-name"
  port             = 8080
}

```

### Workflow example

- **AWS_INSTANCE_SG_ID** : Security group id of the ec2 instance.
- **AWS_ACCESS_KEY_ID** : AWS access key id.
- **AWS_SECRET_ACCESS_KEY** : AWS secret access key.

```yaml
 - name: Checkout source code
          uses: actions/checkout@v4
        - name: Install Transcrypt
          run: git clone https://github.com/elasticdog/transcrypt.git
        - name: Decode secrets
          run: transcrypt/transcrypt -c aes-256-cbc -p '${{ secrets.TRANSCRYPT_KEY }}' -y
        - name: replace .env with .env.staging
          run: cp .env.staging .env
        - name: get runner ip address
          id: ip
          uses: haythem/public-ip@v1.3
        - name: Configure AWS credentials
          uses: aws-actions/configure-aws-credentials@v2
          with:
            aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
            aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
            aws-region: 'eu-west-3'
        - name: whitelist runner ip address
          run: |
            aws ec2 authorize-security-group-ingress \
              --group-id ${{ secrets.AWS_INSTANCE_SG_ID }} \
              --protocol tcp \
              --port 22 \
              --cidr ${{ steps.ip.outputs.ipv4 }}/32
        - name: Install dependencies
          run: yarn install
        - name: Prisma generate
          run: yarn prisma generate
        - name: Build
          run: yarn build
        - name: Generate deployment package
          run: zip -r ./deploy.zip dist yarn.lock .env package.json libs -x '*.git*'
        - name: Deploy to instance
          uses: easingthemes/ssh-deploy@main
          env:
              SSH_PRIVATE_KEY: ${{ secrets.EC2_SSH_KEY }}
              REMOTE_HOST: ${{ secrets.EC2_HOST_DNS }}
              REMOTE_USER: ec2-user
              TARGET: '/home/ec2-user'
              SOURCE: './deploy.zip'
              SCRIPT_AFTER: |
                  unzip -o ./deploy.zip -d ./server
                  rm ./deploy.zip
                  cd ./server
                  yarn install
                  yarn prisma generate
                  cd /home/ec2-user
                  pm2 start /dist/server.js
        - name: Remove runner IP address from whitelist
          run: |
            aws ec2 revoke-security-group-ingress \
              --group-id ${{ secrets.AWS_INSTANCE_SG_ID }} \
              --protocol tcp \
              --port 22 \
              --cidr ${{ steps.ip.outputs.ipv4 }}/32
```
