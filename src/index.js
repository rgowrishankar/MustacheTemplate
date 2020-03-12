/**
 * Copyright 2019 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { EventHandler, KubeClass, KubeApiConfig } = require('@razee/kubernetes-util');
const kubeApiConfig = KubeApiConfig();

const ControllerString = 'MustacheTemplate';
const log = require('./bunyan-api').createLogger(ControllerString);

async function createClassicEventHandler(kc) {
  let result;
  let resourceMeta = await kc.getKubeResourceMeta('kapitan.razee.io/v1alpha1', ControllerString, 'watch');
  if (resourceMeta) {
    const Controller = require(`./${ControllerString}Controller`);
    let params = {
      kubeResourceMeta: resourceMeta,
      factory: Controller,
      kubeClass: kc,
      logger: log,
      requestOptions: { qs: { timeoutSeconds: process.env.CRD_WATCH_TIMEOUT_SECONDS || 300 } },
      livenessInterval: true,
      finalizerString: 'client.featureflagset.kapitan.razee.io'
    };
    result = new EventHandler(params);
  } else {
    log.info(`Unable to find KubeResourceMeta for kapitan.razee.io/v1alpha1: ${ControllerString}`);
  }
  return result;
}

async function createNewEventHandler(kc) {
  let result;
  let resourceMeta = await kc.getKubeResourceMeta('deploy.razee.io/v1alpha1', ControllerString, 'watch');
  if (resourceMeta) {
    const Controller = require(`./${ControllerString}Controller`);
    let params = {
      kubeResourceMeta: resourceMeta,
      factory: Controller,
      kubeClass: kc,
      logger: log,
      requestOptions: { qs: { timeoutSeconds: process.env.CRD_WATCH_TIMEOUT_SECONDS || 300 } },
      livenessInterval: true
    };
    result = new EventHandler(params);
  } else {
    log.error(`Unable to find KubeResourceMeta for deploy.razee.io/v1alpha1: ${ControllerString}`);
  }
  return result;
}

async function main() {
  let kc;
  try {
    log.info(`Running ${ControllerString}Controller.`);
    kc = new KubeClass(kubeApiConfig);
  } catch (e) {
    log.error(e, 'Failed to get KubeClass.');
  }
  try {
    await createClassicEventHandler(kc);
  } catch (e) {
    log.error(e, 'Error creating classic event handler.');
  }
  try {
    await createNewEventHandler(kc);
  } catch (e) {
    log.error(e, 'Error creating new event handler.');
  }
}


main().catch(e => log.error(e));
