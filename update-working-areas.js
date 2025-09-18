db.users.updateMany(
  { role: "user" },
  { $set: { workingAreas: [] } }
); 