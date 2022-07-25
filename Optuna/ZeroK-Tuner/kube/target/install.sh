## Configure AWS creds for minikube. 
minikube addons configure registry-creds
minikube addons enable registry-creds
kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/example/prometheus-operator-crd/monitoring.coreos.com_servicemonitors.yaml

kubectl apply -f ./deployment.yaml
