'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Textarea, Button, Card } from '@/components/ui';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitContactForm } from '@/app/actions';

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactFormClient() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setServerError(null);
    try {
      const result = await submitContactForm(data);
      if (result.success) {
        setSuccess(true);
        reset();
      } else {
        setServerError(result.error || 'Failed to submit message. Please try again.');
      }
    } catch (err: any) {
      setServerError('An unexpected error occurred while sending your message.');
    }
  };

  if (success) {
    return (
      <Card className="border-emerald-500/20 bg-emerald-500/5 p-8 text-center animate-fade-in relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl" />
        </div>

        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-6 text-emerald-400">
          <CheckCircle2 className="w-8 h-8 animate-bounce" />
        </div>

        <h3 className="text-xl font-bold text-[#0B2A55] mb-2">Message Received!</h3>
        <p className="text-xs sm:text-sm text-[#475569] max-w-sm mx-auto mb-6 leading-relaxed">
          Thank you for contacting MediSynx EHR. Your inquiry has been dispatched to our administrative team, and we will follow up with you shortly.
        </p>

        <Button variant="secondary" onClick={() => setSuccess(false)} className="mx-auto border-[#E2E8F0] hover:bg-[#F8FAFC]">
          Send Another Message
        </Button>
      </Card>
    );
  }

  return (
    <Card className="border-[hsl(var(--border))]">
      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-[#0B2A55]">Send Us a Message</h3>
          <p className="text-xs text-[#475569]">Have a question or feedback? Complete the form below.</p>
        </div>

        {serverError && (
          <div className="p-3 border border-red-200 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Email Address"
              placeholder="name@example.com"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>
          
          <Input
            label="Subject"
            placeholder="How can we help you?"
            error={errors.subject?.message}
            {...register('subject')}
          />

          <Textarea
            label="Your Message"
            placeholder="Type your message details here..."
            error={errors.message?.message}
            rows={5}
            {...register('message')}
          />

          <Button
            type="submit"
            loading={isSubmitting}
            className="w-full justify-center text-sm py-2.5"
            variant="primary"
          >
            Send Inquiry <Send className="w-4 h-4 ml-1.5 inline shrink-0" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
