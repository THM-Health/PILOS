#!/bin/bash

DOCKER_DIR=$1
EXPORT_DIR=$2


if ! [ -d "$DOCKER_DIR" ]; then
  echo "Error: '$DOCKER_DIR' NOT found."
  exit 1
fi

if ! [ -f "$DOCKER_DIR/docker-compose.yml" ]; then
  echo "Error: docker compose was NOT found."
  exit 1
fi


DB_CONTAINER_ID=$(docker-compose --file $DOCKER_DIR/docker-compose.yml ps -q db)

mkdir -p $EXPORT_DIR

docker exec -t $DB_CONTAINER_ID psql -d greenlight_production -c "COPY public.users TO STDOUT WITH CSV HEADER" -U postgres > $EXPORT_DIR/users.csv
docker exec -t $DB_CONTAINER_ID psql -d greenlight_production -c "COPY public.rooms TO STDOUT WITH CSV HEADER" -U postgres > $EXPORT_DIR/rooms.csv
docker exec -t $DB_CONTAINER_ID psql -d greenlight_production -c "COPY public.shared_accesses TO STDOUT WITH CSV HEADER" -U postgres > $EXPORT_DIR/shared_accesses.csv

echo "Greenlight database was exported to $EXPORT_DIR"
