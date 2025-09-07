import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkflow extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  no_login_url: string;
  status: 'active' | 'inactive';
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
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
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
WorkflowSchema.index({ created_at: -1 });

const WorkflowModel = (mongoose.models.Workflow as mongoose.Model<IWorkflow>) || mongoose.model<IWorkflow>('Workflow', WorkflowSchema);
export default WorkflowModel;