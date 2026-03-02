/**
 * Script to create admin and seller users
 * Run with: npx tsx scripts/create-admin-user.ts
 */

import { connect } from "../lib/db/connection";
import User from "../lib/db/models/User";
import bcrypt from "bcryptjs";

async function createUsers() {
  try {
    console.log("Connecting to database...");
    await connect();

    // Create Admin User
    const adminEmail = "admin@pickfit.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedAdminPassword = await bcrypt.hash("admin123", 10);
      const admin = new User({
        name: "Admin User",
        email: adminEmail,
        password: hashedAdminPassword,
        role: "admin",
        createdAt: new Date(),
      });
      await admin.save();
      console.log("✅ Admin user created:");
      console.log("   Email: admin@pickfit.com");
      console.log("   Password: admin123");
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    // Create Seller User
    const sellerEmail = "seller@pickfit.com";
    const existingSeller = await User.findOne({ email: sellerEmail });

    if (!existingSeller) {
      const hashedSellerPassword = await bcrypt.hash("seller123", 10);
      const seller = new User({
        name: "Seller User",
        email: sellerEmail,
        password: hashedSellerPassword,
        role: "seller",
        createdAt: new Date(),
      });
      await seller.save();
      console.log("✅ Seller user created:");
      console.log("   Email: seller@pickfit.com");
      console.log("   Password: seller123");
    } else {
      console.log("ℹ️  Seller user already exists");
    }

    // Create Customer User
    const customerEmail = "customer@pickfit.com";
    const existingCustomer = await User.findOne({ email: customerEmail });

    if (!existingCustomer) {
      const hashedCustomerPassword = await bcrypt.hash("customer123", 10);
      const customer = new User({
        name: "Customer User",
        email: customerEmail,
        password: hashedCustomerPassword,
        role: "customer",
        createdAt: new Date(),
      });
      await customer.save();
      console.log("✅ Customer user created:");
      console.log("   Email: customer@pickfit.com");
      console.log("   Password: customer123");
    } else {
      console.log("ℹ️  Customer user already exists");
    }

    console.log("\n🎉 Setup complete! You can now sign in with:");
    console.log("   Admin: admin@pickfit.com / admin123");
    console.log("   Seller: seller@pickfit.com / seller123");
    console.log("   Customer: customer@pickfit.com / customer123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating users:", error);
    process.exit(1);
  }
}

createUsers();
