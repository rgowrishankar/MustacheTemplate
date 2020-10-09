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

const pino = require('pino');

module.exports = {
  'createLogger': function (name = 'MustacheTemplate') {
    
    const loggerConfig = {
      name: name,
      level: (process.env.LOG_LEVEL || 'info'),
      messageKey: 'message'
    };
    let appendage = {};

    try {
      if ( process.env.LOG_APPEND_TO_ALL_JSON ) {
        try {
          appendage = JSON.parse( process.env.LOG_APPEND_TO_ALL_JSON );
        } catch (error) {
          console.error( 'Failed to parse APPEND_TO_LOGS', error );
        }
      }
      return pino(loggerConfig).child(appendage);
    } catch (err) {
      // unknown log level given, default to info
      console.error( '%s.  Defaulting to "info"', err.message );
      loggerConfig.level = 'info';
      return pino(loggerConfig).child(appendage);
    }
  }
};
