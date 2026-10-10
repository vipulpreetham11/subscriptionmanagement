import 'dotenv/config';
import mongoose from 'mongoose';
import Subscription from './models/Subscription.js';

const examples = [
  { serviceName: 'Netflix', plan: 'Standard', amount: 499, billingCycle: 'Monthly', startDate: '2026-09-10', renewalDate: '2026-10-12', status: 'Active', notes: 'Entertainment' },
  { serviceName: 'Spotify', plan: 'Premium Individual', amount: 119, billingCycle: 'Monthly', startDate: '2026-09-18', renewalDate: '2026-10-18', status: 'Active', notes: 'Music' },
  { serviceName: 'GitHub', plan: 'Pro', amount: 400, billingCycle: 'Monthly', startDate: '2026-08-25', renewalDate: '2026-10-25', status: 'Active', notes: 'Development tools' },
  { serviceName: 'Adobe Creative Cloud', plan: 'Photography', amount: 5999, billingCycle: 'Yearly', startDate: '2026-01-01', renewalDate: '2027-01-01', status: 'Active', notes: 'Design tools' },
  { serviceName: 'Cloud Storage', plan: 'Basic', amount: 299, billingCycle: 'Monthly', startDate: '2026-06-01', renewalDate: '2026-09-01', status: 'Paused', notes: 'Backup' }
];

try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/subscription_dashboard');
  if (await Subscription.countDocuments()) {
    console.log('Database already contains subscriptions; seed skipped.');
  } else {
    await Subscription.insertMany(examples.map(s => ({ ...s, user: null })));
    console.log(`Inserted ${examples.length} demo subscriptions.`);
  }
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
