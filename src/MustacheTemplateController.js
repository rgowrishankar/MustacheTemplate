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

const Mustache = require('mustache');
const objectPath = require('object-path');
const yaml = require('js-yaml');

const { BaseTemplateController } = require('@razee/razeedeploy-core');


module.exports = class MustacheTemplateController extends BaseTemplateController {
  constructor(params) {
    params.finalizerString = params.finalizerString || 'children.mustachetemplate.deploy.razee.io';
    super(params);
  }

  async _stringifyTemplates(o) {
    if (!Array.isArray(o)) {
      return Promise.reject({ statusCode: 500, message: '_stringifyTemplates expects an array' });
    }
    o.forEach((obj, i) => {
      if (typeof obj === 'object') {
        o[i] = JSON.stringify(obj);
      }
    });
    return o;
  }

  async _parseTemplates(s) {
    if (!Array.isArray(s)) {
      return Promise.reject({ statusCode: 500, message: '_parseTemplates expects an array' });
    }
    s.forEach((str, i) => {
      if (typeof str === 'string') {
        s[i] = yaml.safeLoad(str);
      }
    });
    return s;
  }

  async processTemplate(templates, view) {
    let customTags = objectPath.get(this.data, ['object', 'spec', 'custom-tags']);
    let templatesArr = await this._stringifyTemplates(templates);
    let tempTags = Mustache.tags;
    if (customTags) {
      Mustache.tags = customTags;
    }
    templatesArr.forEach((templatesString, i) => {
      templatesArr[i] = Mustache.render(templatesString, view);
    });
    Mustache.tags = tempTags;
    let result = await this._parseTemplates(templatesArr);
    return result;
  }

};
