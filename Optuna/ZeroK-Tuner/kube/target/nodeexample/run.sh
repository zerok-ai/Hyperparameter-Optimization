getVal() {
    result=$(cat config.json | jq ".$1")
    echo $result
}

docker kill app
if [[ "$1" == "build" ]]; then
    docker build ./ --tag app
fi

# docker run -it --rm -d -p 8000:8000 --name app \
#     --cpus $(getVal cpus) \
#     --env NUM_CPUS=$(getVal NUM_CPUS) \
#     --memory $(getVal memory)GB \
#     --ulimit nproc=$(getVal ulimit_nproc) \
#     --ulimit nofile=$(getVal ulimit_nofile):$(getVal ulimit_nofile) \
#     app
# echo "Waiting for Container to start"
# until [ \
#   "$(curl -s -w '%{http_code}' -o /dev/null "http://localhost:8000/")" \
#   -eq 200 ]
# do
#   sleep 1
# done
# echo "Started Container"

ECR_URI="301129966109.dkr.ecr.us-east-2.amazonaws.com"
ECR_Region="us-east-2"
ECR_Repo_Name="nodeexample"
ECR_Repo_Version="latest"
ECR_Repo_URI="$ECR_URI/$ECR_Repo_Name:$ECR_Repo_Version"

echo $ECR_Repo_URI
if [[ "$1" == "pull" ]]; then
    aws ecr get-login-password \
    	--region $ECR_Region | docker login \
    	--username AWS \
    	--password-stdin $ECR_URI
    docker pull $ECR_Repo_URI
fi
docker run -it --rm -d -p 3000:3000 --name app \
    --cpus $(getVal cpus) \
    --env NUM_CPUS=$(getVal NUM_CPUS) \
    --memory $(getVal memory)GB \
    --ulimit nproc=$(getVal ulimit_nproc) \
    --ulimit nofile=$(getVal ulimit_nofile):$(getVal ulimit_nofile) \
    $ECR_Repo_URI

echo "Waiting for Container to start"
until [ \
  "$(curl -s -w '%{http_code}' -o /dev/null "http://localhost:3000/highmem")" \
  -eq 200 ]
do
  sleep 1
done
echo "Started Container"

./test.sh
