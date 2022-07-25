function setup {
    cd $1
    ./install.sh
    cd ..
}


minikube start --memory 3934 --cpus 2


minikube addons enable ingress
minikube addons enable ingress-dns

setup prometheus
setup target
setup tester

minikube tunnel

minikube stop
minikube delete
