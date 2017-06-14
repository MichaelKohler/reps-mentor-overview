'use strict';

const _ = require('lodash');
const debug = require('debug')('Reps');
const StorageHandler = require('./storage-handler');
const storageHandler = new StorageHandler();

const UNASSIGNED = 'UNASSIGNED';

class Reps {
  static getAll() {
    return storageHandler.getStorageItem('reps');
  }

  static getGroupedByMentor() {
    debug('Getting all Reps grouped by mentor');
    const reps = this.getAll();
    const repsSortedByMentor = _.groupBy(reps, (rep) => {
      if (!rep.profile.mentor) {
        return UNASSIGNED;
      }

      return rep.profile.mentor.first_name + ' ' + rep.profile.mentor.last_name;
    });

    const keys = Object.keys(repsSortedByMentor);
    const enrichedReps = keys.map((mentorName) => {
      let mentor = this.findByName(mentorName);
      if (!mentor) {
        mentor = {
          first_name: 'Not',
          last_name: 'Assigned',
          display_name: UNASSIGNED
        };
      }

      return {
        mentor,
        mentees: repsSortedByMentor[mentorName]
      };
    });

    const unassignedGroupedReps = [];
    enrichedReps.forEach((enrichedMentor) => {
      const existingEntryIndex = unassignedGroupedReps.findIndex((groupedMentor) => {
        return enrichedMentor.mentor.display_name === groupedMentor.mentor.display_name;
      });

      if (existingEntryIndex > -1) {
        unassignedGroupedReps[existingEntryIndex].mentees = unassignedGroupedReps[existingEntryIndex].mentees.concat(enrichedMentor.mentees);
      } else {
        unassignedGroupedReps.push(enrichedMentor);
      }
    });

    const sorted = _.sortBy(unassignedGroupedReps, 'mentor.first_name');
    return sorted;
  }

  static findByName(name) {
    debug('Getting a Rep by name');
    const allReps = this.getAll();
    let rep = _.find(allReps, (rep) => {
      const fullName = rep.first_name + ' ' + rep.last_name;
      if (fullName === name) {
        return rep;
      }
    });

    return rep;
  }
}

module.exports = Reps;
