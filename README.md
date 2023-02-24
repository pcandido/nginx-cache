# nginx-cache

## How to run

The project includes a docker-compose file that runs:
* An API to represent the upstream. It accepts some query parameters to determine what to respond.
* An instance of Nginx
* A client that sends some requests to the Nginx instance to simulate the presented scenario.

To run the project, you need docker installed.

```bash
$ docker compose build
$ docker compose up
```

And follow the logs, they will explain to you what is happening.