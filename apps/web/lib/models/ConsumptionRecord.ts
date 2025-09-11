import mongoose, { Schema, Document } from 'mongoose';

export interface IConsumptionRecord extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  username: string;
  token: string;
  token_used: number;
  points_used: number;
  cost: number;
  response_data?: any;
  appname?: string;
  created_at: Date;
  updated_at: Date;
}

const ConsumptionRecordSchema: Schema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true
  },
  token_used: {
    type: Number,
    default: 0,
    min: 0
  },
  points_used: {
    type: Number,
    default: 0,
    min: 0
  },
  cost: {
    type: Number,
    default: 0,
    min: 0
  },
  response_data: {
    type: Schema.Types.Mixed,
    default: null
  },
  appname: {
    type: String,
    default: null
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// 创建索引
ConsumptionRecordSchema.index({ user_id: 1 });
ConsumptionRecordSchema.index({ username: 1 });
ConsumptionRecordSchema.index({ token: 1 });
ConsumptionRecordSchema.index({ created_at: -1 });

const ConsumptionRecordModel = (mongoose.models.ConsumptionRecord as mongoose.Model<IConsumptionRecord>) || mongoose.model<IConsumptionRecord>('ConsumptionRecord', ConsumptionRecordSchema);
export default ConsumptionRecordModel;