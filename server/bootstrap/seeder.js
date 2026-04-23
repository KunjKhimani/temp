const User = require("../model/user.model");

const seedAdmin = async () => {
  try {
    const adminData = {
      name: "admin",
      email: "admin@sparework.com",
      password: "admin@main123",
      isAdmin: true,
    };

    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      return;
    }

    const admin = new User(adminData);

    await admin.save();
    console.log("Admin seeded successfully");
  } catch (error) {
    console.error("Error seeding admin:", error.message);
  }
};

module.exports = seedAdmin;
