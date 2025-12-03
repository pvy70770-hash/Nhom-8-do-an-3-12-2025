import React, { useEffect, useState } from "react";
import API from "../../api";

export default function Dashboard({ role }) {
  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState({ title: "", company: "", location: "", salary: "" });

  // Load jobs
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const res = await API.get("/jobs");
    setJobs(res.data);
  };

  const handleAddJob = async () => {
    await API.post("/jobs", newJob);
    fetchJobs();
  };

  const handleDeleteJob = async (id) => {
    await API.delete(`/jobs/${id}`);
    fetchJobs();
  };

  return (
    <div>
      <h2>Dashboard</h2>

      {role === "seeker" && (
        <div>
          <h3>Danh sách công việc</h3>
          <ul>
            {jobs.map((job) => (
              <li key={job.id}>
                {job.title} - {job.company} - {job.location} - {job.salary}
              </li>
            ))}
          </ul>
        </div>
      )}

      {role === "employer" && (
        <div>
          <h3>Quản lý công việc</h3>
          <input placeholder="Title" onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} />
          <input placeholder="Company" onChange={(e) => setNewJob({ ...newJob, company: e.target.value })} />
          <input placeholder="Location" onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} />
          <input placeholder="Salary" onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })} />
          <button onClick={handleAddJob}>Thêm Job</button>

          <ul>
            {jobs.map((job) => (
              <li key={job.id}>
                {job.title} - {job.company} 
                <button onClick={() => handleDeleteJob(job.id)}>Xóa</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
