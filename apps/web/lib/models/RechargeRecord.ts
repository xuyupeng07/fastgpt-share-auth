import mongoose, { Schema, Document } from 'mongoose';

export interface IRechargeRecord extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  username: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  remark?: string;
  created_at: Date;
  updated_at: Date;
}

const RechargeRecordSchema: Schema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  balance_before: {
    type: Number,
    required: true,
    min: 0
  },
  balance_after: {
    type: Number,
    required: true,
    min: 0
  },
  remark: {
    type: String,
    default: ''
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// 创建索引
RechargeRecordSchema.index({ user_id: 1 });
RechargeRecordSchema.index({ username: 1 });
RechargeRecordSchema.index({ token: 1 });
RechargeRecordSchema.index({ created_at: -1 });

const RechargeRecordModel = (mongoose.models.RechargeRecord as mongoose.Model<IRechargeRecord>) || mongoose.model<IRechargeRecord>('RechargeRecord', RechargeRecordSchema);
export default RechargeRecordModel;