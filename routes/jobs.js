const express = require("express");
const router = express.Router();

const {
  listJobs,
  newJobShow,
  createJob,
  editJobShow,
  updateJob,
  deleteJob,
} = require("../controllers/jobs");

router.get("/", listJobs);
router.get("/new", newJobShow);
router.post("/", createJob);

router.get("/edit/:id", editJobShow);
router.post("/update/:id", updateJob);
router.post("/delete/:id", deleteJob);

module.exports = router;