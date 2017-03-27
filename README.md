# videotron-story

## DOCKER
###How To Run this website on a Dockerized NGINX

```
docker run --name docker-nginx -p 80:80 -d -v <PATH_TO_YOUR_HTML_FILES>:/usr/share/nginx/html nginx
```