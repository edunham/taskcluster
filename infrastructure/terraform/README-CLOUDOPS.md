In this directory = ready to tarraform
to__review = has not been looked at yet
to_convert_to_helm = what this tf code does will be switched to helmm

bin/ directory has scripts for creating things that must be done outside terraform

things to think about
1) script generation of all aws access keys needed?
2) srcipt creation of rabbitmq accounts?
3) deployment, scheduled-job and service-secrets modules look like what we need generic generators for to use per-service

Helm templating: `helm template directoryname` works iff it's run on a directory structured like `helm create` emits, such as `taskcluster-helm`
