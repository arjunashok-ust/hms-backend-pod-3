const mongoose = require("mongoose");
const Node = require("../models/Node");

const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const NODE_SEED_DATA = [
  {
    node_id: 1,
    name: "Dashboard",
    path: "/dashboard",
    role: ["admin","super_admin"],
    icon: "bi bi-speedometer2",
  },
  {
    node_id: 2,
    name: "Employee",
    path: "/employees",
    role: ["super_admin","admin"],
    icon: "bi bi-people",
  },
  {
    node_id: 3,
    name: "Approval",
    path: "/approval",
    role: ["super_admin","admin"],
    icon: "bi bi-shield-check",
  },
  {
    node_id: 4,
    name: "Patient",
    path: "/patients",
    role: ["super_admin","admin", "receptionist"],
    icon: "bi bi-heart-pulse",
  },
  {
    node_id: 5,
    name: "User Profile",
    path: "/profile",
    role: ["super_admin","admin", "doctor", "receptionist", "cashier", "nurse", "lab_Tech", "pharmacist"],
    icon: "bi bi-person",
  },
  {
    node_id: 6,
    name: "Appointment",
    path: "/appointments",
    role: ["super_admin","admin", "receptionist", "doctor"],
    icon: "bi bi-calendar",
  },
  {
    node_id: 7,
    name: "Node Menu",
    path: "/node-menu",
    role: ["super_admin", "admin"],
    icon: "bi bi-diagram-3",
  },
  {
    node_id: 8,
    name: "Medical Record",
    path: "/medical-records",
    role: ["super_admin", "admin", "doctor", "receptionist"],
    icon: "bi bi-file-earmark-medical",
  },
  {
    node_id: 9,
    name: "Role Menu",
    path: "/role-menu",
    role: ["super_admin", "admin"],
    icon: "bi bi-person-gear",
  },
];

const seedNodes = async () => {
  for (const nodeData of NODE_SEED_DATA) {
    await Node.findOneAndUpdate(
      { node_id: nodeData.node_id },
      nodeData,
      { upsert: true, new: true }
    );
  }
  console.log("Nodes seeded successfully");
};

if (require.main === module) {
  require("dotenv").config();
  mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
      await seedNodes();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedNodes;