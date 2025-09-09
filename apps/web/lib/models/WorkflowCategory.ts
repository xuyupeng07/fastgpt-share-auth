import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkflowCategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  sort_order: number;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

const WorkflowCategorySchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  sort_order: {
    type: Number,
    default: 0,
    min: 0
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

// 创建索引（name字段已通过unique: true自动创建索引）
WorkflowCategorySchema.index({ sort_order: 1 });
WorkflowCategorySchema.index({ status: 1 });
WorkflowCategorySchema.index({ created_at: -1 });

const WorkflowCategoryModel = (mongoose.models.WorkflowCategory as mongoose.Model<IWorkflowCategory>) || mongoose.model<IWorkflowCategory>('WorkflowCategory', WorkflowCategorySchema);

export default WorkflowCategoryModel;