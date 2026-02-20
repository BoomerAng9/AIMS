#!/bin/bash
set -e
cd /root/aims
ENV_FILE=infra/.env.production
COMPOSE_FILE=infra/docker-compose.prod.yml

# Update env
sed -i 's|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://plugmein.cloud|' $ENV_FILE
sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=https://plugmein.cloud,https://aimanagedsolutions.cloud|' $ENV_FILE

grep -q 'NEXT_PUBLIC_LANDING_URL=' $ENV_FILE && sed -i 's|NEXT_PUBLIC_LANDING_URL=.*|NEXT_PUBLIC_LANDING_URL=https://aimanagedsolutions.cloud|' $ENV_FILE || echo 'NEXT_PUBLIC_LANDING_URL=https://aimanagedsolutions.cloud' >> $ENV_FILE
grep -q 'NEXT_PUBLIC_APP_URL=' $ENV_FILE && sed -i 's|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://plugmein.cloud|' $ENV_FILE || echo 'NEXT_PUBLIC_APP_URL=https://plugmein.cloud' >> $ENV_FILE

echo '[1/5] Env updated:'
grep -E 'NEXTAUTH_URL|CORS_ORIGIN|LANDING_URL|APP_URL' $ENV_FILE

# SSL for plugmein.cloud
echo '[2/5] Checking SSL for plugmein.cloud...'
CERT_EXISTS=$(docker compose -f $COMPOSE_FILE run --rm certbot certificates 2>&1 | grep -c 'plugmein.cloud' || true)
if [ "$CERT_EXISTS" -gt 0 ]; then
    echo 'SSL cert already exists for plugmein.cloud'
else
    echo 'Issuing SSL for plugmein.cloud...'
    docker compose -f $COMPOSE_FILE run --rm certbot certonly --webroot -w /var/www/certbot -d plugmein.cloud --email admin@aimanagedsolutions.cloud --agree-tos --non-interactive
fi

# SSL for aimanagedsolutions.cloud
echo '[3/5] Checking SSL for aimanagedsolutions.cloud...'
LANDING_CERT_EXISTS=$(docker compose -f $COMPOSE_FILE run --rm certbot certificates 2>&1 | grep -c 'aimanagedsolutions.cloud' || true)
if [ "$LANDING_CERT_EXISTS" -gt 0 ]; then
    echo 'SSL cert already exists for aimanagedsolutions.cloud'
else
    echo 'Issuing SSL for aimanagedsolutions.cloud + www...'
    docker compose -f $COMPOSE_FILE run --rm certbot certonly --webroot -w /var/www/certbot -d aimanagedsolutions.cloud -d www.aimanagedsolutions.cloud --email admin@aimanagedsolutions.cloud --agree-tos --non-interactive
fi

# Activate SSL nginx configs
echo '[4/5] Configuring nginx SSL...'
SSL_TEMPLATE=infra/nginx/ssl.conf.template
SSL_LANDING_TEMPLATE=infra/nginx/ssl-landing.conf.template

if [ -f "$SSL_TEMPLATE" ]; then
    SSL_CONF=$(sed "s/DOMAIN_PLACEHOLDER/plugmein.cloud/g" "$SSL_TEMPLATE")
    echo "$SSL_CONF" | docker compose -f $COMPOSE_FILE exec -T nginx sh -c 'cat > /etc/nginx/conf.d/ssl.conf'
    echo 'ssl.conf written'
fi

if [ -f "$SSL_LANDING_TEMPLATE" ]; then
    SSL_LANDING_CONF=$(sed "s/LANDING_DOMAIN_PLACEHOLDER/aimanagedsolutions.cloud/g" "$SSL_LANDING_TEMPLATE")
    echo "$SSL_LANDING_CONF" | docker compose -f $COMPOSE_FILE exec -T nginx sh -c 'cat > /etc/nginx/conf.d/ssl-landing.conf'
    echo 'ssl-landing.conf written'
fi

# Reload nginx
echo '[5/5] Reloading nginx...'
docker compose -f $COMPOSE_FILE exec nginx nginx -s reload
echo 'DONE! Both domains configured with SSL.'
