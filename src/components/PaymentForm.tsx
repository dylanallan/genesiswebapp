import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const paymentSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
});

type PaymentForm = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
  });

  const onSubmit = async (data: PaymentForm) => {
    try {
      setIsLoading(true);

      // Create payment intent
      const { data: paymentIntent, error: intentError } = await supabase
        .functions.invoke('create-payment-intent', {
          body: { amount: data.amount * 100, currency: 'usd' },
        });

      if (intentError) throw intentError;

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      // Confirm the payment
      const { error: stripeError } = await stripe.confirmCardPayment(paymentIntent.clientSecret, {
        payment_method: {
          card: {
            // In a real implementation, you would use Stripe Elements here
            number: '4242424242424242',
            exp_month: 12,
            exp_year: 2024,
            cvc: '123',
          },
          billing_details: {
            name: data.name,
            email: data.email,
          },
        },
      });

      if (stripeError) throw stripeError;

      toast.success('Payment successful!');
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center space-x-2 mb-6">
        <CreditCard className="w-6 h-6 text-genesis-600" />
        <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            {...register('name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-genesis-500 focus:ring-genesis-500"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            {...register('email')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-genesis-500 focus:ring-genesis-500"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Amount (USD)</label>
          <input
            type="number"
            {...register('amount', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-genesis-500 focus:ring-genesis-500"
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-genesis-600 hover:bg-genesis-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-genesis-500 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Pay Now'
          )}
        </button>
      </form>
    </div>
  );
};