'use strict';

const _ = require('lodash');
const debug = require('debug')('Reps');
const StorageHandler = require('./storage-handler');
const storageHandler = new StorageHandler();

const UNASSIGNED = 'UNASSIGNED';

class Reps {
  static getAll() {
    return storageHandler.getStorageItem('REPS_USERS');
  }

  static getGroupedByMentor() {
    debug('Getting all Reps grouped by mentor');
    const reps = this.getAll();

    // Pre-emptively add mentors to the array with empty array
    // This ensures that we don't miss any mentors who don't have any
    // mentees.
    const allMentorsWithMentees = reps.reduce((result, rep) => {
      const hasMentorGroup = rep.groups.find((group) => group.name === 'Mentor');
      if (hasMentorGroup) {
        const repFullName = rep.first_name + ' ' + rep.last_name;
        result[repFullName] = [];
      }

      return result;
    }, {});

    allMentorsWithMentees[UNASSIGNED] = [];

    reps.forEach((rep) => {
      const mentorFullName = Reps.getMentorFullName(rep);
      let mentorGroup = allMentorsWithMentees[mentorFullName];

      if (mentorGroup) {
        mentorGroup.push(rep);
      } else {
        allMentorsWithMentees[UNASSIGNED].push(rep);
      }
    });

    // Bring the grouped structure into a better enriched structure
    // with information about the mentor as well
    const keys = Object.keys(allMentorsWithMentees);
    const enrichedMentors = keys.map((mentorName) => {
      let mentor = this.findByName(mentorName);
      if (!mentor) {
        mentorName = UNASSIGNED;
        mentor = {
          first_name: 'Not',
          last_name: 'Assigned',
          display_name: UNASSIGNED
        };
      }

      return {
        mentor,
        mentees: allMentorsWithMentees[mentorName]
      };
    });

    // Sort by first name
    // TODO: ignore 'UNASSIGNED' and push it to the end of the list
    const sorted = _.sortBy(enrichedMentors, 'mentor.first_name');
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

  static getMentorFullName(rep) {
    return rep.mentor && rep.mentor.first_name ? rep.mentor.first_name + ' ' + rep.mentor.last_name : UNASSIGNED;
  }
}

module.exports = Reps;
