# Custom docker image
1. You can build your own images from source by cloning the [PILOS Repository](https://github.com/THM-Health/PILOS) or your fork.
2. Next, checkout the branch you want to build the image from.
3. If you like, you can now modify the source code.

4. Then run this command in the source directory to create a new container with the tag `pilos/pilos:custom-version`.
```bash
docker build -f docker/app/Dockerfile -t pilos/pilos:custom-version .
```

## Alternative: Build from Github
If you don't want to modify the source, you can also build directly from Github.
In this example, we will use the code from the `2.x` branch and create a new image with the tag `pilos/pilos:custom-version`.
```bash
docker build -f docker/app/Dockerfile -t pilos/pilos:custom-version https://github.com/THM-Health/PILOS.git#2.x
```
To learn more about this syntax, check out the [Docker docs](https://docs.docker.com/engine/reference/commandline/image_build/#git-repositories).
