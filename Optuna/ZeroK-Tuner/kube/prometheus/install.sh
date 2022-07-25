# add helm repo for prometheus
echo '---------------------- Updating helm repo for kube-prometheus-stack'
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update 

# create namespace for monitoring stack
echo '---------------------- Creating namespace - `monitoring`'
kubectl create namespace monitoring

# install kube-prometheus
echo '---------------------- Installing kube-prometheus-stack'
helm upgrade --install prom prometheus-community/kube-prometheus-stack \
	--namespace monitoring \
	--values ./config.yaml

# helm install prometheus prometheus-community/prometheus --namespace monitoring \
# 	--values ./config.yaml \
# 	--set --enable-feature=remote-write-receiver

sleep 120
kubectl apply -f ./ingress.yaml
./install_grafana_dashboard.sh tuning_dashboard
