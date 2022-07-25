# install service monitor
kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/example/prometheus-operator-crd/monitoring.coreos.com_servicemonitors.yaml

kubectl delete -f deployment.yaml

cd xk6
### Build container directly in minikube
# minikube image build -t tester .
minikube image rm tester
docker image rm tester

docker build --no-cache --tag tester .
# docker run -it --rm -d -p 3000:3000 --name app app
echo "loading image into minikube.. gonna take time"
minikube image load tester:latest --overwrite=true --daemon

cd ..

kubectl apply -f ./deployment.yaml