#!/bin/bash

sudo yum update -y

# Install volta
sudo -u ec2-user bash <<EOF
cd ~
curl https://get.volta.sh | bash
source .bashrc
volta install node
volta install pm2
volta install yarn
EOF

# Install Caddy
yum -y install yum-plugin-copr
yum -y copr enable @caddy/caddy epel-7-$(arch)
yum -y install caddy

# Start Caddy
sudo systemctl enable caddy
sudo systemctl start caddy

# Add Caddyfile
if [ -n "${domain_name}" ]; then
    echo "${domain_name} {
        reverse_proxy localhost:${port}
    }" >/etc/caddy/Caddyfile
    caddy fmt /etc/caddy/Caddyfile --overwrite
    caddy reload --config /etc/caddy/Caddyfile
fi

# Add private ssh key
if [ -n "${ssh_private_key}" ]; then
    sudo echo "${ssh_private_key}" >/home/ec2-user/.ssh/id_rsa
    sudo chmod 600 /home/ec2-user/.ssh/id_rsa
    sudo chown ec2-user:ec2-user /home/ec2-user/.ssh/id_rsa
fi
