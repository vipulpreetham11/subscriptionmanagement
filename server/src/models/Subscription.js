import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  serviceName: { type: String, required: true, trim: true, maxlength: 100 },
  plan: { type: String, required: true, trim: true, maxlength: 100 },
  amount: { type: Number, required: true, min: 0 },
  billingCycle: { type: String, enum: ['Weekly', 'Monthly', 'Quarterly', 'Yearly'], required: true, default: 'Monthly' },
  startDate: { type: Date, required: true },
  renewalDate: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Paused', 'Cancelled'], default: 'Active' },
  notes: { type: String, trim: true, maxlength: 500, default: '' }
}, { timestamps: true });

subscriptionSchema.index({ user: 1, renewalDate: 1 });
export default mongoose.model('Subscription', subscriptionSchema);
