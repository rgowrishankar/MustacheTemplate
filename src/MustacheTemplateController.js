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

const { BaseTemplateController } = require('@razee/kapitan-core');


module.exports = class MustacheTemplateController extends BaseTemplateController {
  constructor(params) {
    params.finalizerString = params.finalizerString || 'children.mustachetemplate.kapitan.razee.io';
    super(params);
  }

  async _stringify(o) {
    return JSON.stringify(o);
  }

  async _parse(s) {
    return JSON.parse(s);
  }

  async processTemplate(templates, view) {
    let customTags = objectPath.get(this.data, ['object', 'spec', 'custom-tags']);
    let templatesString = await this._stringify(templates);
    let tempTags = Mustache.tags;
    if (customTags) {
      Mustache.tags = customTags;
    }
    let resultString = Mustache.render(templatesString, view);
    Mustache.tags = tempTags;
    let result = await this._parse(resultString);
    return result;
  }

};
