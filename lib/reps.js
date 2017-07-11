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

    const repsSortedByMentor = reps.reduce((result, rep) => {
      const mentorFullName = Reps.getMentorFullName(rep);
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
    const enrichedMentors = keys.map((mentorName) => {
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
    const allMentors = [];
    enrichedMentors.forEach((enrichedMentor) => {
      const existingEntryIndex = allMentors.findIndex((groupedMentor) => {
        return enrichedMentor.mentor.display_name === groupedMentor.mentor.display_name;
      });

      if (existingEntryIndex > -1) {
        allMentors[existingEntryIndex].mentees = allMentors[existingEntryIndex].mentees.concat(enrichedMentor.mentees);
      } else {
        allMentors.push(enrichedMentor);
      }
    });

    // Sort by first name
    // TODO: ignore 'UNASSIGNED' and push it to the end of the list
    const sorted = _.sortBy(allMentors, 'mentor.first_name');
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
    return rep.profile.mentor && rep.profile.mentor.first_name ? rep.profile.mentor.first_name + ' ' + rep.profile.mentor.last_name : UNASSIGNED;
  }
}

module.exports = Reps;
