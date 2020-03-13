FROM nginx:1.17

COPY . /usr/share/nginx/html
COPY config-sample.json /usr/share/nginx/html/config.json
COPY docker/docker-entrypoint.d /docker-entrypoint.d
COPY docker/entrypoint.sh /
COPY docker/run.sh /run.sh
COPY docker/nginx.conf.template /etc/nginx/conf.d/default.conf.template
ENV PROXY_PASS studio-backend-python
#python or php
ENV MVIEWER_BACKEND python
ENTRYPOINT ["/entrypoint.sh"]
# it's nearly impossible to run nginx correctly without wrapping it into a file
CMD ["/run.sh"]
