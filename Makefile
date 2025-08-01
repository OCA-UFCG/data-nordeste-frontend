ifneq (,$(wildcard .env))
    include .env
endif

PWD=$(shell pwd)
NODE_IMAGE=node:20.12.2
IMAGE_NAME=data-nordeste-frontend
CONTAINER_PORT=3000

# PROD Env
HOST_PORT_PROD=3000
CONTAINER_NAME_PROD=data-nordeste-frontend-app

#BETA Env
HOST_PORT_BETA=6000
CONTAINER_NAME_BETA=data-nordeste-frontend-app-beta

run-dev:
	npm run dev

run-prod:
	npm run build
	npm run start

docker-build-dev:
	docker build -t $(IMAGE_NAME) .

docker-run-dev:
	docker run -p 3000:$(CONTAINER_PORT) --name $(IMAGE_NAME) -v node_modules -v $(PWD):/app --user $(id -u):$(id -g) $(IMAGE_NAME)

docker-run-dev-mac:
	docker run -p 3000:$(CONTAINER_PORT) --name $(IMAGE_NAME) -v /app/node_modules -v $(PWD):/app -w /app --user $(id -u):$(id -g) $(IMAGE_NAME)

docker-build-prod:
	docker build \
		--build-arg NEXT_PUBLIC_GA_ID=${NEXT_PUBLIC_GA_ID} \
		--build-arg NEXT_PUBLIC_HOST_URL=${NEXT_PUBLIC_HOST_URL} \
		--build-arg NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN=${NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN} \
		--build-arg NEXT_PUBLIC_CONTENTFUL_PREVIEW=${NEXT_PUBLIC_CONTENTFUL_PREVIEW} \
		--build-arg NEXT_PUBLIC_CONTENTFUL_SPACE=${NEXT_PUBLIC_CONTENTFUL_SPACE} \
		-t $(IMAGE_NAME) \
		-f Dockerfile.production .

docker-run-prod:
	docker run --name $(CONTAINER_NAME_PROD) -p $(HOST_PORT_PROD):$(CONTAINER_PORT) -d --restart always $(IMAGE_NAME)

docker-run-beta:
	docker run --name $(CONTAINER_NAME_BETA) -p $(HOST_PORT_BETA):$(CONTAINER_PORT) -d --restart always $(IMAGE_NAME)
