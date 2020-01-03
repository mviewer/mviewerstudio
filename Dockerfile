FROM nginx:1.17

COPY . /usr/share/nginx/html
COPY config-sample.json /usr/share/nginx/html/config.json
COPY nginx.conf /etc/nginx/conf.d/default.conf
