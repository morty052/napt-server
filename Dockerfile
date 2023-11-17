FROM denoland/deno:latest as base

WORKDIR /app

ADD . /app

RUN deno cache server.ts

CMD ["run", "--allow-net", "--allow-read", "--allow-env" ,"server.ts"]
