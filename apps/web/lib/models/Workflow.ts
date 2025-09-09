import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkflow extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  no_login_url: string;
  category_id?: mongoose.Types.ObjectId;
  status: 'active' | 'inactive';
  usageCount: number;
  likeCount: number;
  created_at: Date;
  updated_at: Date;
}

const WorkflowSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  no_login_url: {
    type: String,
    required: true,
    trim: true
  },
  category_id: {
    type: Schema.Types.ObjectId,
    ref: 'WorkflowCategory',
    required: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  likeCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// 创建索引
WorkflowSchema.index({ name: 1 });
WorkflowSchema.index({ status: 1 });
WorkflowSchema.index({ category_id: 1 });
WorkflowSchema.index({ created_at: -1 });

const WorkflowModel = (mongoose.models.Workflow as mongoose.Model<IWorkflow>) || mongoose.model<IWorkflow>('Workflow', WorkflowSchema);
export default WorkflowModel;