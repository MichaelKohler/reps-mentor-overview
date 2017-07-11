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

  // TODO: holy, this is a mess.. how about some refactoring?
  static getGroupedByMentor() {
    debug('Getting all Reps grouped by mentor');
    const reps = this.getAll();

    const repsSortedByMentor = reps.reduce((result, rep) => {
      const mentorFullName = rep.profile.mentor && rep.profile.mentor.first_name ? rep.profile.mentor.first_name + ' ' + rep.profile.mentor.last_name : UNASSIGNED;
      const mentorGroup = result[mentorFullName];

      // Push the rep to the respective mentor
      if (mentorGroup) {
        mentorGroup.push(rep);
      } else {
        result[mentorFullName] = [rep];
      }

      // Pre-emptively add mentors to the array with empty array
      // This ensures that we don't miss any mentors who don't have any
      // mentees.
      const hasMentorGroup = rep.profile.groups.find((group) => group.name === 'Mentor');
      if (hasMentorGroup) {
        const repFullName = rep.profile.first_name + ' ' + rep.profile.last_name;

        result[repFullName] = result[repFullName] ? result[repFullName] : [];
      }

      return result;
    }, {})

    // Bring the grouped structure into a better enriched structure
    // with information about the mentor as well
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

    // Treaat unassigned Reps as their own category. These would otherwise
    // show up with their old mentor as they are still assigned on the
    // Reps portal.
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

    // Sort by first name
    // TODO: ignore 'UNASSIGNED' and push it to the end of the list
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
