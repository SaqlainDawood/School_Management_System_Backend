import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import School from '../models/School.js';
import Class from '../models/Class.js';
import Department from '../models/Department.js';
import connectDB from '../config/database.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('🗑️ Clearing existing data...');
    await User.deleteMany();
    await School.deleteMany();
    await Class.deleteMany();
    await Department.deleteMany();

    console.log('🌱 Seeding data...');

    // Create Super Admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@school.com',
      password: 'admin123',
      role: 'superadmin',
      isActive: true,
      isVerified: true,
    });
    console.log(`✅ Super Admin created: ${superAdmin.email}`);

    // Create School
    const school = await School.create({
      name: 'Springfield International School',
      code: 'SIS001',
      type: 'private',
      level: 'combined',
      address: {
        street: '123 Education Street',
        city: 'Lahore',
        state: 'Punjab',
        zipCode: '54000',
        country: 'Pakistan',
      },
      contact: {
        phone: '+92-42-123-4567',
        email: 'info@springfieldschool.edu',
        website: 'https://springfieldschool.edu',
      },
      adminId: superAdmin._id,
      establishedYear: 2005,
      motto: 'Excellence in Education',
      description: 'A premier institution dedicated to academic excellence.',
    });
    console.log(`✅ School created: ${school.name}`);

    // Create Department
    const department = await Department.create({
      name: 'Computer Science',
      code: 'CS',
      description: 'Department of Computer Science',
      coordinator: superAdmin._id,
    });
    console.log(`✅ Department created: ${department.name}`);

    // Create Class
    const classData = await Class.create({
      name: 'Class 10',
      code: 'C10',
      description: 'Grade 10',
      academicYear: '2026-2027',
      capacity: 60,
      roomNumber: 'C101',
      isActive: true,
    });
    console.log(`✅ Class created: ${classData.name}`);

    // Create Admin
    const adminUser = await User.create({
      name: 'School Admin',
      email: 'admin@school.com',
      password: 'admin123',
      role: 'admin',
      schoolId: school._id,
      isActive: true,
      isVerified: true,
    });
    console.log(`✅ Admin created: ${adminUser.email}`);

    // Create Teacher
    const teacherUser = await User.create({
      name: 'John Teacher',
      email: 'teacher@school.com',
      password: 'teacher123',
      role: 'teacher',
      schoolId: school._id,
      isActive: true,
      isVerified: true,
    });
    console.log(`✅ Teacher created: ${teacherUser.email}`);

    // Create Student
    const studentUser = await User.create({
      name: 'Student User',
      email: 'student@school.com',
      password: 'student123',
      role: 'student',
      schoolId: school._id,
      isActive: true,
      isVerified: true,
    });
    console.log(`✅ Student created: ${studentUser.email}`);

    // Create Parent
    const parentUser = await User.create({
      name: 'Parent User',
      email: 'parent@school.com',
      password: 'parent123',
      role: 'parent',
      schoolId: school._id,
      isActive: true,
      isVerified: true,
    });
    console.log(`✅ Parent created: ${parentUser.email}`);

    // Create Coordinator
    const coordinatorUser = await User.create({
      name: 'Coordinator User',
      email: 'coordinator@school.com',
      password: 'coordinator123',
      role: 'coordinator',
      schoolId: school._id,
      isActive: true,
      isVerified: true,
    });
    console.log(`✅ Coordinator created: ${coordinatorUser.email}`);

    // Create Examination
    const examinationUser = await User.create({
      name: 'Examination User',
      email: 'examination@school.com',
      password: 'examination123',
      role: 'examination',
      schoolId: school._id,
      isActive: true,
      isVerified: true,
    });
    console.log(`✅ Examination created: ${examinationUser.email}`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📝 Sample login credentials:');
    console.log('   Super Admin: superadmin@school.com / admin123');
    console.log('   Admin: admin@school.com / admin123');
    console.log('   Teacher: teacher@school.com / teacher123');
    console.log('   Student: student@school.com / student123');
    console.log('   Parent: parent@school.com / parent123');
    console.log('   Coordinator: coordinator@school.com / coordinator123');
    console.log('   Examination: examination@school.com / examination123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();