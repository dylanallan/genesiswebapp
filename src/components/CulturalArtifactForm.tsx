import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, Plus, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

const artifactSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  media_url: z.string().url().optional().or(z.literal('')),
  media_type: z.string().optional(),
  tags: z.array(z.string()).optional()
});

type ArtifactFormData = z.infer<typeof artifactSchema>;

interface CulturalArtifactFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Partial<ArtifactFormData>;
  isEditing?: boolean;
}

export const CulturalArtifactForm: React.FC<CulturalArtifactFormProps> = ({
  onClose,
  onSuccess,
  initialData,
  isEditing = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ArtifactFormData>({
    resolver: zodResolver(artifactSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      category: initialData?.category || '',
      media_url: initialData?.media_url || '',
      media_type: initialData?.media_type || '',
      tags: initialData?.tags || []
    }
  });

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    setValue('tags', newTags);
  };

  const onSubmit = async (data: ArtifactFormData) => {
    setIsSubmitting(true);
    
    try {
      if (isEditing && initialData?.id) {
        const { error } = await supabase
          .from('cultural_artifacts')
          .update({
            title: data.title,
            description: data.description,
            category: data.category,
            media_url: data.media_url,
            media_type: data.media_type,
            tags: data.tags
          })
          .eq('id', initialData.id);

        if (error) throw error;
        toast.success('Artifact updated successfully');
      } else {
        const { error } = await supabase
          .from('cultural_artifacts')
          .insert([data]);

        if (error) throw error;
        toast.success('Artifact added successfully');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving artifact:', error);
      toast.error('Failed to save artifact');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Title"
        {...register('title')}
        error={errors.title?.message}
        placeholder="Enter artifact title"
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          {...register('description')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Describe the cultural significance of this artifact"
        />
        {errors.description?.message && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            {...register('category')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a category</option>
            <option value="image">Image</option>
            <option value="document">Document</option>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
            <option value="other">Other</option>
          </select>
          {errors.category?.message && (
            <p className="text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Media URL (optional)
          </label>
          <Input
            {...register('media_url')}
            error={errors.media_url?.message}
            placeholder="https://example.com/media.jpg"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Tags
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add a tag and press Enter"
          />
          <Button
            type="button"
            onClick={addTag}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag, index) => (
            <div
              key={index}
              className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button
          type="button"
          onClick={onClose}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          className="flex-1"
        >
          {isEditing ? 'Update Artifact' : 'Save Artifact'}
        </Button>
      </div>
    </form>
  );
};