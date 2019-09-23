# MustacheTemplate

[![Build Status](https://travis-ci.com/razee-io/MustacheTemplate.svg?branch=master)](https://travis-ci.com/razee-io/MustacheTemplate)
[![Greenkeeper badge](https://badges.greenkeeper.io/razee-io/MustacheTemplate.svg)](https://greenkeeper.io/)
![GitHub](https://img.shields.io/github/license/razee-io/MustacheTemplate.svg?color=success)

MustacheTemplate is the next step of complexity when working with Razee. With
MustacheTemplate we can inject cluster specific environment variables into
resources before applying them to a cluster. We even use this injection method
as the mechanism for version control of our resources.

The basic operation of MustacheTemplate is to collect all values defined in
`.spec.envFrom` and `.spec.env`, then use those values to process all yaml
defined in the `.spec.templates`, and finally apply the processed yaml to the cluster.

## Install

```shell
kubectl apply -f "https://github.com/razee-io/MustacheTemplate/releases/latest/download/resource.yaml"
```

## Resource Definition

### Sample

```yaml
apiVersion: "deploy.razee.io/v1alpha1"
kind: MustacheTemplate
metadata:
  name: <mustache_template_name>
  namespace: <namespace>
spec:
  custom-tags: ['<%', '%>']
  envFrom:
  - optional: true
    configMapRef:
      name: <ConfigMap Name>
      namespace: <ConfigMap Namespace>
  env:
  - name: desired-replicas
    value: 3
  - name: app-label
    optional: true
    default: "deployment 1"
    valueFrom:
      configMapKeyRef:
         name: <ConfigMap Name>
         namespace: <ConfigMap Namespace>
         key: <key within that ConfigMap
  templates:
  - apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: nginx-deployment
      labels:
        app: nginx
        deployment: {{ app-label }}
    spec:
      replicas: {{ desired-replicas }}
      selector:
        matchLabels:
          app: nginx
      template:
        metadata:
          labels:
            app: nginx
        spec:
          containers:
          - name: nginx
            image: nginx:1.7.9
            ports:
            - containerPort: 80
```

### Required Fields

- `.spec.templates`
  - type: array
  - items:
    - type: object
    - required: [kind, apiVersion, metadata]

## Features

### Custom Tags

`.spec.custom-tags`

Specifying custom tags will override the default mustache tags. this can be useful
when you need to reserve `{{ }}` for some other processing.

- Schema:
  - type: array
  - minItems/maxItems: 2
  - items:
    - type: string
    - minLength: 2
    - maxLength: 3
  - default: `['{{', '}}']`

### EnvFrom

`.spec.envFrom`

Allows you to pull in all values from a resource's `.data` to be used in template
processing. **Note**: values are loaded in `.spec.envFrom` before
`.spec.env`, top down. Any values with the same key/name will be overwritten;
last in wins.

- Schema:
  - type: array
  - items:
    - type: object
    - required: oneOf [configMapRef, secretMapRef, genericMapRef]
    - optional: [optional]

#### EnvFrom Ref

- `.spec.envFrom.configMapRef` || `.spec.envFrom.secretMapRef`
  - retrieves all values from a ConfigMap or Secret. The keys from the ConfigMap
  or Secret become the names used to insert the referenced value into the template.
  - Schema:
    - type: object
    - required: [name]
    - optional: [namespace]
- `.spec.envFrom.genericMapRef`
  - retrieves all values from any resource kind that has a `.data` section to pull
   from. The keys from the `.data` section become the names used to insert the referenced
   value into the template.
  - Schema:
    - type: object
    - required: [apiVersion, kind, name]
    - optional: [namespace]

#### EnvFrom Optional

`.spec.envFrom.optional`

- DEFAULT: `false`
  - if fetching env/envFrom resource fails, MustacheTemplate will stop
  execution and report error to `.status`.
- `true`
  - if fetching env/envFrom resource fails, MustacheTemplate will continue
  attempting to process the templates, and will report info to `.status`.
- Schema:
  - type: boolean

### Env

`.spec.env`

Allows you to pull in a single value from a resource's `.data` to be used in template
processing. **Note**: values are loaded in `.spec.envFrom` before
`.spec.env`, top down. Any values with the same key/name will be overwritten;
last in wins.

- Schema:
  - type: array
  - items:
    - type: object
    - required:
      - name
      - oneOf [value, valueFrom.configMapKeyRef, valueFrom.secretKeyRef, valueFrom.genericKeyRef]
    - optional: [optional, default]

#### Env Ref

- `.spec.env.name`
  - name used to insert the referenced value into the template
  - Schema:
    - type: string
- `.spec.env.value`
  - static value to inject into template
  - Schema:
    - type: number|string|boolean
- `.spec.env.valueFrom.configMapKeyRef` || `.spec.env.valueFrom.secretKeyRef`
  - value referenced from a specific key in a ConfigMap or Secret
  - Schema:
    - type: object
    - required: [name, key]
    - optional: [namespace]
- `.spec.env.valueFrom.genericKeyRef`
  - value referenced from a specific key in any resource kind that has a `.data`
  section to pull data from.
  - Schema:
    - type: object
    - required: [apiVersion, kind, name, key]
    - optional: [namespace]

#### Env Optional

`.spec.env.optional`

- DEFAULT: `false`
  - if fetching env/envFrom resource fails, MustacheTemplate will stop
  execution and report error to `.status`.
  - **Note**: if `.spec.env.default` is specified, that value will
  be used, execution  will continue, and MustacheTemplate will report info to `.status`.
- `true`
  - if fetching env/envFrom resource fails, MustacheTemplate will continue
  attempting to process the templates, and will report info to `.status`.

#### Env Default

`.spec.env.default`

If fetching env/envFrom resource fails, will use the value specified by default.

- Schema:
  - type: number|string|boolean

### Managed Resource Labels

#### Reconcile

`.spec.templates.metadata.labels[deploy.razee.io/Reconcile]`

- DEFAULT: `true`
  - A razeedeploy resource (parent) will clean up a resources it applies (child)
when either the child is no longer in the parent resource definition or the
parent is deleted.
- `false`
  - This behavior can be overridden when a child's resource definition has
the label `deploy.razee.io/Reconcile=false`.

#### Resource Update Mode

`.spec.templates.metadata.labels[deploy.razee.io/mode]`

Razeedeploy resources default to merge patching children. This behavior can be
overridden when a child's resource definition has the label
`deploy.razee.io/mode=<mode>`

Mode options:

- DEFAULT: `MergePatch`
  - A simple merge, that will merge objects and replace arrays. Items previously
  defined, then removed from the definition, will be removed from the live resource.
  - "As defined in [RFC7386](https://tools.ietf.org/html/rfc7386), a Merge Patch
  is essentially a partial representation of the resource. The submitted JSON is
  "merged" with the current resource to create a new one, then the new one is
  saved. For more details on how to use Merge Patch, see the RFC." [Reference](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md#patch-operations)
- `StrategicMergePatch`
  - A more complicated merge, the kubernetes apiServer has defined keys to be
  able to intelligently merge arrays it knows about.
  - "Strategic Merge Patch is a custom implementation of Merge Patch. For a
  detailed explanation of how it works and why it needed to be introduced, see
  [StrategicMergePatch](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-api-machinery/strategic-merge-patch.md)."
  [Reference](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md#patch-operations)
  - [Kubectl Apply Semantics](https://kubectl.docs.kubernetes.io/pages/app_management/field_merge_semantics.html)
- `EnsureExists`
  - Will ensure the resource is created and is replaced if deleted. Will not
  enforce a definition.

### Debug Individual Resource

`.spec.resources.metadata.labels[kapitan.razee.io/debug]`

Treats the live resource as EnsureExist. If any Kapitan component is enforcing
the resource, and the label `kapitan.razee.io/debug: true` exists on the live
resource, it will treat the resource as ensure exist and not override any changes.
This is useful for when you need to debug a live resource and dont want Kapitan
overriding your changes. Note: this will only work when you add it to live resources.
If you want to have the EnsureExist behavior, see [Resource Update Mode](#Resource-Update-Mode).

- ie: `kubectl label mtp <your-mtp> kapitan.razee.io/debug=true`

### Lock Cluster Updates

Prevents the controller from updating resources on the cluster. If this is the
first time creating the `razeedeploy-config` ConfigMap, you must delete the running
controller pods so the deployment can mount the ConfigMap as a volume. If the
`razeedeploy-config` ConfigMap already exists, just add the pair `lock-cluster: true`.

1. `export CONTROLLER_NAME=mustachetemplate-controller && export CONTROLLER_NAMESPACE=razee`
1. `kubectl create cm razeedeploy-config -n $CONTROLLER_NAMESPACE --from-literal=lock-cluster=true`
1. `kubectl delete pods -n $CONTROLLER_NAMESPACE $(kubectl get pods -n $CONTROLLER_NAMESPACE
 | grep $CONTROLLER_NAME | awk '{print $1}' | paste -s -d ',' -)`
