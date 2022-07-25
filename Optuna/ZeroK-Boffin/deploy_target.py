from kubernetes import client, config, watch

class TargetDeployer:
    namespace_name="target"
    deployment_name="target-deployment"
    deployment_image="301129966109.dkr.ecr.us-east-2.amazonaws.com/nodeexample"
    container_name="load-test"

    core_api = None
    apps_api = None
    watcher = None

    def __init__(self):
        config.load_kube_config()
        self.core_api = client.CoreV1Api()
        self.apps_api = client.AppsV1Api()
        self.watcher = watch.Watch()

        # print(config.list_kube_config_contexts())

    def start(self):
        self.initialize_namespace()
        self.deploy_target()

    def initialize_namespace(self, namespace_name=namespace_name):
        namespace = client.V1Namespace(
            api_version = "v1",
            kind = "Namespace",
            metadata = client.V1ObjectMeta(name=namespace_name)
        )
        self.core_api.create_namespace(namespace)

    def delete_namespace(self, namespace_name=namespace_name):
        self.core_api.delete_namespace(namespace_name)

    def deploy_target(self):
        container = client.V1Container(
            name=self.container_name,
            image=self.deployment_image,
            ports = [client.V1ContainerPort(container_port=80)],
        )

        template=client.V1PodTemplateSpec(
            metadata = client.V1ObjectMeta(labels={"app": "target"}),
            spec = client.V1PodSpec(
                containers = [container]
            )
        )

        deployment_spec = client.V1DeploymentSpec(
            selector=client.V1LabelSelector(match_labels={"app":"target"}),
            template=template,
            replicas = 1
        )

        deployment = client.V1Deployment(
            api_version = "apps/v1",
            kind = "Deployment",
            metadata = client.V1ObjectMeta(name=self.deployment_name),
            spec=deployment_spec
        )
        self.apps_api.create_namespaced_deployment(namespace=self.namespace_name, body=deployment)

    def update_deployment_limits(self, cpu, memory):
        deployment = self.apps_api.read_namespaced_deployment(self.deployment_name, self.namespace_name)
        limits = {'cpu':str(cpu)+'m', 'memory':str(memory)+'Mi'}
        # requests = limits
        # if deployment.spec.template.spec.containers[0].resources is not None:
        # requests = deployment.spec.template.spec.containers[0].resources.requests
        deployment.spec.template.spec.containers[0].resources = client.V1ResourceRequirements(limits=limits)
        self.apps_api.replace_namespaced_deployment(name=self.deployment_name, namespace=self.namespace_name, body=deployment)

    def update_deployment_requests(self, cpu, memory):
        deployment = self.apps_api.read_namespaced_deployment(self.deployment_name, self.namespace_name)
        requests = {'cpu':str(cpu)+'m', 'memory':str(memory)+'Mi'}
        limits = deployment.spec.template.spec.containers[0].resources.limits
        deployment.spec.template.spec.containers[0].resources = client.V1ResourceRequirements(requests=requests, limits=limits)
        self.apps_api.replace_namespaced_deployment(name=self.deployment_name, namespace=self.namespace_name, body=deployment)

    def update_deployment_image(self, image=deployment_image):
        deployment = self.apps_api.read_namespaced_deployment(self.deployment_name, self.namespace_name)
        deployment.spec.template.spec.containers[0].image = image
        self.apps_api.replace_namespaced_deployment(name=self.deployment_name, namespace=self.namespace_name, body=deployment)

