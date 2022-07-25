import json
import optuna
import subprocess
from kubernetes import client, config

# Configs can be set in Configuration class directly or using helper utility
config.load_kube_config()

core_api = client.CoreV1Api()
apps_api = client.AppsV1Api()

core_api.create_namespace()
def objective(trial):
    config = {
        "cpus" : round(trial.suggest_float("cpus", 1, 2, step=0.1), 2),
        "memory" : round(trial.suggest_float("memory", 1, 2.0, step=0.1), 2),
        "ulimit_nproc" : trial.suggest_int("ulimit_nproc", 100, 2784),
        "ulimit_nofile" : trial.suggest_int("ulimit_nofile", 1024, 65532),
        "NUM_CPUS" : trial.suggest_int("NUM_CPUS", 1, 1),
    }

    # Writing config
    json.dump(config, open("config.json", "w"), indent = 4)

    result = subprocess.run(['sh','./run.sh'], stdout=subprocess.PIPE)
    # subprocess.run(['echo', result.stdout])

    summary_object = json.load(open("summary.json"))
    status_object = json.load(open("status.json"))
    print("Passes: {}, Fails: {}".format(status_object.get('passes'), status_object.get('fails')) )
    return summary_object.get('avg')

study = optuna.create_study(sampler=optuna.samplers.TPESampler())
study.optimize(objective, n_trials=10)

best_params = study.best_params
print(best_params)
