'use strict';

const debug = require('debug')('ReMo');
const fetch = require('node-fetch');
const StorageHandler = require('./storage-handler');

class RemoHelper {
  constructor() {
    this.url = 'https://reps.mozilla.org/api/remo/v1/users/?format=json';
    this.data = [];
    this.fetchLength = 20;
    this.fetchedPages = 0;
    this.storageHandler = new StorageHandler();
  }

  /**
   * Initializes a query for all Reps.
   *
   * @return {Promise}              Promise which resolves with all Reps found
   */
  getAll() {
    return new Promise((resolve, reject) => {
      this.fetchPagesRecursively(this.url, resolve, reject);
    });
  }

  /**
   * Fetches Reps
   *
   * @param  {String}  url           page of the current iteration
   * @param  {Function} resolve      Promise resolve function
   * @param  {Function} reject       Promise reject function
   * @param  {Number} numberOfPages  number of pages to fetch
   */
  fetchPagesRecursively(url, resolve, reject, numberOfPages) {
    debug(`getting next page ${url}`);

    fetch(url).then((res) => {
      return res.json();
    }).then((response) => {
      const results = response.results;
      if (!response || results.length === 0) {
        return reject(new Error(`we did not get any more data from the API`))
      }

      debug(`got ${results.length} entries`);
      this.fetchedPages = this.fetchedPages + 1;
      this.data = this.data.concat(results);

      if (results && results.length === this.fetchLength) {
        if (numberOfPages && this.fetchedPages === numberOfPages) {
          return resolve(this.data);
        }

        debug(`we need to get more!`);
        return this.fetchPagesRecursively(response.next, resolve, reject, numberOfPages);
      }

      resolve(this.data);
    }).catch((err) => {
      reject(err);
    });
  }

  /**
   * Fetches a Reps sub URL
   */
  fetchRepsUrl(url) {
    return new Promise((resolve, reject) => {
      fetch(url).then((res) => {
        debug('Successfully fetched', url);
        return res.json();
      })
      .then((response) => {
        resolve(response);
      })
      .catch((err) => {
        debug('We had an error fetching', url, err);
      });
    });
  }
}

module.exports = RemoHelper;
