# MustacheTemplate

[![Build Status](https://travis-ci.com/razee-io/MustacheTemplate.svg?branch=master)](https://travis-ci.com/razee-io/MustacheTemplate)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=razee-io/MustacheTemplate)](https://dependabot.com)
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
apiVersion: deploy.razee.io/v1alpha2
kind: MustacheTemplate
metadata:
  name: <mustache_template_name>
  namespace: <namespace>
spec:
  envFrom:
  - genericMapRef:
      apiVersion: deploy.razee.io/v1alpha2
      kind: FeatureFlagSetLD
      name: myLDProject
      namespace: default
  env:
    - name: app-label
      value: "deployment 1"
    - name: desired-replicas
      valueFrom:
        configMapKeyRef:
          name: nginx-config
          key: replicas
          type: number
  templates:
  - apiVersion: v1
    kind: ConfigMap
    metadata:
      name: test-config
    data:
      sample: "{{ desired-replicas }}"
  strTemplates:
  - |
      apiVersion: apps/v1
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

### Spec

**Path:** `.spec`

**Description:** `spec` is required and **must** include at least one [`envFrom`
, `env`] and at least one [`templates`, `strTemplates`].

**Schema:**

```yaml
spec:
  type: object
  allOf:
    - anyOf:
        - required: [templates]
        - required: [strTemplates]
    - anyOf:
        - required: [envFrom]
        - required: [env]
  properties:
    custom-tags:
      type: array
      ...
    envFrom:
      type: array
      ...
    env:
      type: array
      ...
    templates:
      type: array
      ...
    strTemplates:
      type: array
      ...
```

### Templating Engine

**Path:** `.spec.templateEngine`

**Description:** Specifying which templating engine to use, the available
options are `mustache` and `handlebars`

**Schema:**

```yaml
properties:
  templateEngine:
    type: string
    pattern: "^mustache$|^handlebars$"
```

**Default:** `'mustache'`

### Custom Tags

**Path:** `.spec.custom-tags`

**Description:** Specifying custom tags will override the default mustache tags.
This can be useful when you need to reserve `{{ }}` for some other processing.

**Schema:**

```yaml
custom-tags:
  type: array
  maxItems: 2
  minItems: 2
  items:
    type: string
    maxLength: 3
    minLength: 2
```

**Default:** `['{{', '}}']`

### EnvFrom

**Path:** `.spec.envFrom`

**Description:** Allows you to pull in all values from a resource's `.data` section
to be used in template processing. ie. ConfigMaps would use the `configMapRef` key
and CRDs with a high level `.data` section can be pulled in by using the
`genericMapRef` key. The keys pulled from the resource are what you would use
to match values into your templates.

**Note:**: values are loaded in from `.spec.envFrom` before `.spec.env`, and
top down. Any values with the same key/name will be overwritten, last in wins.

**Schema:**

```yaml
envFrom:
  type: array
  items:
    type: object
    oneOf:
      - required: [configMapRef]
      - required: [secretMapRef]
      - required: [genericMapRef]
    properties:
      optional:
        type: boolean
      configMapRef:
        type: object
        required: [name]
        properties:
          name:
            type: string
          namespace:
            type: string
      secretMapRef:
        type: object
        required: [name]
        properties:
          name:
            type: string
          namespace:
            type: string
      genericMapRef:
        type: object
        required: [apiVersion, kind, name]
        properties:
          apiVersion:
            type: string
          kind:
            type: string
          name:
            type: string
          namespace:
            type: string
```

#### EnvFrom Optional

**Path:** `.spec.envFrom[].optional`

**Description:** If fetching env/envFrom resource fails, MustacheTemplate will stop
execution and report error to `.status`. You can allow execution to continue by
marking a reference as optional.

**Schema:**

```yaml
optional:
  type: boolean
```

**Default:** `false`

### Env

**Path:** `.spec.env`

**Description:** Allows you to pull in a single value from a resource's `.data`
section to be used in template processing. ie. ConfigMaps would use the
`configMapKeyRef` key and CRDs with a high level `.data` section can be pulled
from by using the `genericKeyRef` key. `.spec.env.name` is what you would use to
match values into your templates. You can also specify a `type` that we will
convert your fetched string into, before injecting into your template (one of
[number, boolean, json, jsonString, base64]).

**Note:** values are loaded in from `.spec.envFrom` before `.spec.env`, and
top down. Any values with the same key/name will be overwritten, last in wins.

**Schema:**

```yaml
env:
  type: array
  items:
    type: object
    allOf:
      - required: [name]
      - # all array items should be oneOf ['value', 'valueFrom']
        oneOf:
          - required: [value]
            # if 'value', neither 'optional' nor 'default' may be used
            not:
              anyOf:
                - required: [default]
                - required: [optional]
          - required: [valueFrom]
            # if 'valueFrom', you must define oneOf:
            oneOf:
              - # neither 'optional' nor 'default' is used
                not:
                  anyOf:
                    - required: [default]
                    - required: [optional]
              - # 'optional' is used by itself
                required: [optional]
                not:
                  required: [default]
              - # 'optional' and 'default' are used together IFF optional == true
                required: [optional, default]
                properties:
                  optional:
                    enum: [true]
    properties:
      optional:
        type: boolean
      default:
        x-kubernetes-int-or-string: true
      name:
        type: string
      value:
        x-kubernetes-int-or-string: true
      valueFrom:
        type: object
        oneOf:
          - required: [configMapKeyRef]
          - required: [secretKeyRef]
          - required: [genericKeyRef]
        properties:
          configMapKeyRef:
            type: object
            required: [name, key]
            properties:
              name:
                type: string
              key:
                type: string
              namespace:
                type: string
              type:
                type: string
                enum: [number, boolean, json, jsonString, base64]
          secretKeyRef:
            type: object
            required: [name, key]
            properties:
              name:
                type: string
              key:
                type: string
              namespace:
                type: string
              type:
                type: string
                enum: [number, boolean, json, jsonString, base64]
          genericKeyRef:
            type: object
            required: [apiVersion, kind, name, key]
            properties:
              apiVersion:
                type: string
              kind:
                type: string
              name:
                type: string
              key:
                type: string
              namespace:
                type: string
              type:
                type: string
                enum: [number, boolean, json, jsonString, base64]
```

#### Env Optional

**Path:** `.spec.env[].optional`

**Description:** If fetching env/envFrom resource fails, MustacheTemplate will stop
execution and report error to `.status`. You can allow execution to continue by
marking a reference as `optional: true`.

**Schema:**

```yaml
optional:
  type: boolean
```

**Default:** `false`

#### Env Default

**Path:** `.spec.env[].default`

**Description:** If fetching env/envFrom resource fails, but `.spec.env[].optional`
is `true` and `.spec.env[].default` is defined, the default value will be used.

**Schema:**

```yaml
default:
  x-kubernetes-int-or-string: true
```

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

`.spec.resources.metadata.labels[deploy.razee.io/debug]`

Treats the live resource as EnsureExist. If any Kapitan component is enforcing
the resource, and the label `deploy.razee.io/debug: true` exists on the live
resource, it will treat the resource as ensure exist and not override any changes.
This is useful for when you need to debug a live resource and dont want Kapitan
overriding your changes. Note: this will only work when you add it to live resources.
If you want to have the EnsureExist behavior, see [Resource Update Mode](#Resource-Update-Mode).

- ie: `kubectl label mtp <your-mtp> deploy.razee.io/debug=true`

### Lock Cluster Updates

Prevents the controller from updating resources on the cluster. If this is the
first time creating the `razeedeploy-config` ConfigMap, you must delete the running
controller pods so the deployment can mount the ConfigMap as a volume. If the
`razeedeploy-config` ConfigMap already exists, just add the pair `lock-cluster: true`.

1. `export CONTROLLER_NAME=mustachetemplate-controller && export CONTROLLER_NAMESPACE=razee`
1. `kubectl create cm razeedeploy-config -n $CONTROLLER_NAMESPACE --from-literal=lock-cluster=true`
1. `kubectl delete pods -n $CONTROLLER_NAMESPACE $(kubectl get pods -n $CONTROLLER_NAMESPACE
 | grep $CONTROLLER_NAME | awk '{print $1}' | paste -s -d ',' -)`
