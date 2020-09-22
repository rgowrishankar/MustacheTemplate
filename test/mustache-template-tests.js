var assert = require('chai').assert;
var Controller = require('../src/MustacheTemplateController');

describe('#processTemplates', async function () {
  const eventData = {
    object: {
      'apiVersion': 'deploy.razee.io/v1alpha1',
      'kind': 'MustacheTemplate',
      'metadata': {
        'name': 'seed-config',
        'namespace': 'cpdaas-cluster-config'
      },
      'spec': {
        'envFrom': [
          {
            'configMapRef': {
              'apiVersion': 'v1',
              'name': 'crn-info-ibmc',
              'namespace': 'kube-system'
            }
          }
        ],
        'strTemplates': [
          'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: seed-config\ndata:\n  "{{ CRN_REGION }}": "true"\n'
        ]
      }
    }
  };
  const noop = () => {};
  const kubeResourceMeta = {
    uri: noop,
  };
  const logger = {
    info: noop,
  };
  it('should evaulate a mustache template correctly', async function () {
    const controller = new Controller({eventData, kubeResourceMeta, logger});
    const res = await controller.processTemplate(eventData.object.spec.strTemplates, { CRN_REGION: 'us-east'});
    assert.deepEqual(res[0].data, {'us-east': 'true'});
  });

  it('should evaulate a handlebars template correctly', async function () {
    eventData.object.spec['templateEngine'] = 'handlebars';
    eventData.object.spec.strTemplates = [              
      'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: seed-config\ndata:\n  {{#if CRN_REGION}}\n  "region": {{ CRN_REGION }}\n  {{/if}}'
    ];
    const controller = new Controller({eventData, kubeResourceMeta, logger});
    const res = await controller.processTemplate(eventData.object.spec.strTemplates, { CRN_REGION: 'us-east'});
    assert.equal(res[0].data.region, 'us-east');
  });

  it('should evaulate a handlebars template correctly with an equality register helper', async function () {
    eventData.object.spec['templateEngine'] = 'handlebars';
    eventData.object.spec.strTemplates = [              
      'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: seed-config\ndata:\n  {{#if (eq CRN_REGION "us-west") }}\n  "region": {{ CRN_REGION }}\n  {{/if}}'
    ];
    const controller = new Controller({eventData, kubeResourceMeta, logger});
    
    const res = await controller.processTemplate(eventData.object.spec.strTemplates, { CRN_REGION: 'us-west'});
    assert.equal(res[0].data.region, 'us-west');
  });

  it('should be able to assign a var in handlebars with the "assign" helper', async function () {
    eventData.object.spec['templateEngine'] = 'handlebars';
    eventData.object.spec.strTemplates = [              
      'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: seed-config\ndata:\n  {{ assign "GEO" "us-west" }}\n  "region": {{ GEO }}'
    ];
    const controller = new Controller({eventData, kubeResourceMeta, logger});
    
    const res = await controller.processTemplate(eventData.object.spec.strTemplates, { CRN_REGION: 'us-west'});
    assert.equal(res[0].data.region, 'us-west');
  });

  it('should throw succeed without any view data', async function () {
    eventData.object.spec['templateEngine'] = 'handlebars';
    eventData.object.spec.strTemplates = [              
      'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: seed-config\ndata:\n  {{ assign "GEO" "us-west" }}\n  "region": {{ GEO }}'
    ];
    const controller = new Controller({eventData, kubeResourceMeta, logger});
    const res = await controller.processTemplate(eventData.object.spec.strTemplates, {});
    assert.equal(res[0].data.region, 'us-west');
  });
});
