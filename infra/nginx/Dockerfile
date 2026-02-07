FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf && \
    mkdir -p /var/www/certbot /etc/nginx/conf.d

COPY nginx.conf /etc/nginx/nginx.conf
COPY ssl.conf.template /etc/nginx/ssl.conf.template

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
