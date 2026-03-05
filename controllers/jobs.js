const Job = require("../models/Job");
const parseValidationErrors = require("../utils/parseValidationErrors");

const listJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ createdBy: req.user._id }).sort({
      createdAt: -1,
    });
    res.render("jobs", { jobs });
  } catch (e) {
    next(e);
  }
};

const newJobShow = (req, res) => {
  res.render("job", { job: null });
};

const createJob = async (req, res, next) => {
  try {
    const { company, position, status } = req.body;

    await Job.create({
      company,
      position,
      status,
      createdBy: req.user._id,
    });

    req.flash("info", "Job created.");
    res.redirect("/jobs");
  } catch (e) {
    if (e.name === "ValidationError") {
      parseValidationErrors(e, req);
      return res.render("job", { job: null });
    }
    next(e);
  }
};

const editJobShow = async (req, res, next) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!job) {
      req.flash("error", "Job not found.");
      return res.redirect("/jobs");
    }

    res.render("job", { job });
  } catch (e) {
    next(e);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const { company, position, status } = req.body;

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { company, position, status },
      { new: true, runValidators: true }
    );

    if (!job) {
      req.flash("error", "Job not found.");
      return res.redirect("/jobs");
    }

    req.flash("info", "Job updated.");
    res.redirect("/jobs");
  } catch (e) {
    if (e.name === "ValidationError") {
      parseValidationErrors(e, req);
      // re-render edit view with what user typed
      return res.render("job", {
        job: { _id: req.params.id, ...req.body },
      });
    }
    next(e);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!job) {
      req.flash("error", "Job not found.");
      return res.redirect("/jobs");
    }

    req.flash("info", "Job deleted.");
    res.redirect("/jobs");
  } catch (e) {
    next(e);
  }
};

module.exports = {
  listJobs,
  newJobShow,
  createJob,
  editJobShow,
  updateJob,
  deleteJob,
};