'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import ConfirmationModal from './ConfirmationModal';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any, isRecurrent: number) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  initialDate?: Date;
  initialEvent?: any;
}

export default function EventModal({ isOpen, onClose, onSubmit, onDelete, initialDate, initialEvent }: EventModalProps) {
  const { register, handleSubmit, setValue, reset, watch } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialEvent) {
        // Edit Mode
        setValue('title', initialEvent.title);
        setValue('description', initialEvent.description);
        setValue('start_date', format(new Date(initialEvent.start), "yyyy-MM-dd"));
        setValue('start_time', format(new Date(initialEvent.start), "HH:mm"));
        
        // Calculate duration based on start/end difference
        const start = new Date(initialEvent.start).getTime();
        const end = new Date(initialEvent.end).getTime();
        const diffMinutes = Math.round((end - start) / 60000);
        setValue('duration', diffMinutes);
      } else if (initialDate) {
        // Create Mode
        reset();
        setValue('start_date', format(initialDate, "yyyy-MM-dd"));
        setValue('start_time', format(initialDate, "HH:mm"));
        setValue('duration', 60); // Default 1 hour
        setValue('weekly_episodes', 1);
      }
    }
  }, [isOpen, initialDate, initialEvent, setValue, reset]);

  const onFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Construct start datetime string
      const startDateTime = new Date(`${data.start_date}T${data.start_time}`);
      
      // Calculate End datetime based on duration
      const endDateTime = new Date(startDateTime.getTime() + data.duration * 60000);

      const payload = {
        title: data.title,
        description: data.description || "",
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
      };

      await onSubmit(payload, parseInt(data.weekly_episodes || '1'));
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{initialEvent ? 'Edit Event' : 'Add New Watch Party'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input {...register('title', { required: true })} className="input-field" placeholder="Movie or Show Name" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" {...register('start_date', { required: true })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <input type="time" {...register('start_time', { required: true })} className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
            <input type="number" {...register('duration', { required: true, min: 1 })} className="input-field" />
          </div>

          {!initialEvent && (
            <div>
              <label className="block text-sm font-medium mb-1">Weekly Recurring Episodes</label>
              <input 
                type="number" 
                {...register('weekly_episodes', { min: 1 })} 
                defaultValue={1}
                className="input-field" 
              />
              <p className="text-xs text-gray-500 mt-1">Number of weeks to repeat this slot</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea {...register('description')} className="input-field h-24" placeholder="Episode details, notes..."></textarea>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="flex-1 btn-primary">
              {isSubmitting ? 'Saving...' : 'Save Plan'}
            </button>
            
            {initialEvent && onDelete && (
               <button 
                  type="button" 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="btn-danger px-4"
                >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
      </div>
      <ConfirmationModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => onDelete && onDelete(initialEvent.id)}
        title="Delete Event?"
        message="Are you sure you want to remove this event from your plan? This cannot be undone."
        confirmText="Delete"
        isDangerous={true}
      />
      <style jsx>{`
        .input-field {
          @apply w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 ring-blue-500 outline-none transition-all;
        }
        .btn-primary {
          @apply bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md transition-colors disabled:opacity-50;
        }
        .btn-danger {
          @apply bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-md transition-colors flex items-center justify-center;
        }
      `}</style>
    </div>
  );
}