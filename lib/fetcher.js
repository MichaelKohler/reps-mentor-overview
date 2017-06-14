'use strict';

const debug = require('debug')('fetch');
const async = require('async');
const RemoHelper = require('./remo-helper');
const StorageHandler = require('./storage-handler');

class Fetcher {
  constructor() {
    this.remoHelper = new RemoHelper();
    this.storageHandler = new StorageHandler();
  }

  fetchAll() {
    debug('Starting to fetch everything...');
    this.storageHandler.removeStorageItem('reps');

    return this.remoHelper.getAll()
      .then((reps) => {
        debug(`Fetched ${reps.length} Reps from API`);

        return new Promise((resolve, reject) => {
          async.series(reps.map((rep) => {
            return (done) => {
              this.remoHelper.fetchRepsUrl(rep._url)
                .then((profile) => {
                  rep.profile = profile;
                  done();
                });
            };
          }), (err, results) => {
            if (err) {
              reject(err);
            } else {
              console.log(reps);
              resolve(reps);
            }
          }, true);
        });
      })
      .then((advancedInfoReps) => {
        this.storageHandler.saveStorageItem('reps', advancedInfoReps);
      })
      .catch((err) => {
        debug('Error fetching from Reps', err);
      });
  }
}

module.exports = Fetcher;
