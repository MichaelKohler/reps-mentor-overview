const express = require('express');
const Reps = require('../lib/reps');
const router = express.Router();

router.get('/', (req, res, next) => {
  const reps = Reps.getGroupedByMentor()
  res.render('index', {
    title: 'Reps Mentors',
    reps
  });
});

module.exports = router;
